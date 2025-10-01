const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const Follow = require('../models/Follow');
const ShopReview = require('../models/ShopReview');
const ShopReport = require('../models/ShopReport');
const Message = require('../models/Message');

const router = express.Router();

// Public list shops with optional filters: ?featured=true&limit=10&q=term
router.get('/', async (req, res) => {
  try {
    const { featured, limit = 20, q: query } = req.query;
    const match = { status: 'active', isActive: true };
    if (featured === 'true') match.isFeatured = true;
    if (query && String(query).trim()) {
      const regex = new RegExp(String(query).trim(), 'i');
      match.$or = [{ name: regex }, { slug: regex }];
    }
    const lim = Math.min(parseInt(limit, 10) || 20, 50);
    const shops = await Shop.find(match)
      .select('name slug logo isVerified')
      .sort({ createdAt: -1 })
      .limit(lim)
      .lean();
    return res.json({ success: true, shops });

// Follow / Unfollow a shop (authenticated users)
router.post('/:id/follow', auth(), async (req, res) => {
  try {
    const follow = !!req.body?.follow;
    const shopId = req.params.id;
    if (follow) {
      // upsert follow
      await Follow.updateOne(
        { shop: shopId, user: req.user.id },
        { $setOnInsert: { shop: shopId, user: req.user.id, createdAt: new Date() } },
        { upsert: true }
      );
    } else {
      await Follow.deleteOne({ shop: shopId, user: req.user.id });
    }
    const count = await Follow.countDocuments({ shop: shopId });
    res.json({ success: true, isFollowing: follow, followers: count });
  } catch (err) {
    console.error('Follow shop error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

  } catch (err) {
    console.error('List shops error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk fetch shops by IDs
router.post('/bulk', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) return res.json({ success: true, shops: [] });
    const shops = await Shop.find({ _id: { $in: ids } })
      .select('name slug logo owner')
      .lean();
    return res.json({ success: true, shops });
  } catch (err) {
    console.error('Bulk shops error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Report a shop (authenticated users). Accepts { reason, details?, conversation? }
router.post('/:id/report', auth(), [body('reason').isString().isLength({ min: 3 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const doc = await ShopReport.create({
      shop: req.params.id,
      reporter: req.user.id,
      reason: req.body.reason,
      details: req.body.details,
      conversation: req.body.conversation || undefined,
    });
    res.status(201).json({ success: true, report: doc });
  } catch (err) {
    console.error('Report shop error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a shop (seller/admin)
router.post(
  '/',
  auth(['seller', 'admin', 'superadmin']),
  requireRole(['seller', 'admin', 'superadmin']),
  [
    body('name').isString().isLength({ min: 2 }).withMessage('name is required'),
    body('description').optional().isString(),
    body('logo').optional().isObject(),
    body('banner').optional().isObject(),
    body('contactEmail').optional().isEmail(),
    body('contactPhone').optional().isString(),
    body('website').optional().isString(),
    body('address').optional().isObject(),
    body('categories').optional().isArray(),
    body('tags').optional().isArray(),
    body('themeColor').optional().isString(),
    body('icon3d').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      // Build contact/address/settings/metadata from flat or nested input
      const contact = {
        email: req.body.contactEmail || req.body.contact?.email,
        phone: req.body.contactPhone || req.body.contact?.phone,
        website: req.body.website || req.body.contact?.website,
        social: req.body.contact?.social,
      };

      const addressInput = req.body.address || {};
      let address = undefined;
      if (Object.keys(addressInput).length) {
        address = {
          street: addressInput.street,
          city: addressInput.city,
          state: addressInput.state,
          country: addressInput.country || 'India',
          pincode: addressInput.pincode,
          location: addressInput.location,
          isDefault: true,
        };
        // Sanitize GeoJSON location: require [lng, lat] numeric array of length 2
        if (
          address.location && (
            !Array.isArray(address.location.coordinates) ||
            address.location.coordinates.length !== 2 ||
            address.location.coordinates.some((n) => typeof n !== 'number' || Number.isNaN(n))
          )
        ) {
          delete address.location;
        }
      }

      const metadata = {
        ...(req.body.icon3d ? { icon3d: req.body.icon3d } : {}),
        ...(req.body.themeColor ? { themeColor: req.body.themeColor } : {}),
        ...(req.body.metadata || {}),
      };

      const shopData = {
        name: req.body.name,
        owner: req.user.id,
        description: req.body.description,
        logo: req.body.logo, // { url, publicId }
        banner: req.body.banner, // { url, publicId }
        contact,
        address,
        businessHours: req.body.businessHours,
        categories: req.body.categories || [],
        tags: req.body.tags || [],
        metadata,
        // status defaults to 'pending' until admin approves
      };

      const shop = await Shop.create(shopData);
      return res.status(201).json({ success: true, shop });
    } catch (err) {
      console.error('Create shop error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Get current user's shop (seller/admin)
router.get('/my', auth(['seller', 'admin', 'superadmin']), async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ success: false, message: 'No shop found for this user' });
    return res.json({ success: true, shop });
  } catch (err) {
    console.error('Get my shop error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get shop by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug })
      .populate('owner', 'username email profile.fullName profile.avatarUrl');
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    return res.json({ success: true, shop });
  } catch (err) {
    console.error('Get shop error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update shop (owner or admin)
router.put(
  '/:id',
  auth(['seller', 'admin', 'superadmin']),
  requireRole(['seller', 'admin', 'superadmin']),
  async (req, res) => {
    try {
      const shop = await Shop.findById(req.params.id);
      if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

      const isOwner = String(shop.owner) === String(req.user.id);
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
      if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.logo !== undefined) updates.logo = req.body.logo; // { url, publicId }
      if (req.body.banner !== undefined) updates.banner = req.body.banner; // { url, publicId }
      if (req.body.categories !== undefined) updates.categories = req.body.categories;
      if (req.body.tags !== undefined) updates.tags = req.body.tags;
      if (req.body.contact || req.body.contactEmail || req.body.contactPhone || req.body.website) {
        updates.contact = {
          email: req.body.contactEmail || req.body.contact?.email || shop.contact?.email,
          phone: req.body.contactPhone || req.body.contact?.phone || shop.contact?.phone,
          website: req.body.website || req.body.contact?.website || shop.contact?.website,
          social: req.body.contact?.social || shop.contact?.social,
        };
      }
      if (req.body.address) {
        updates.address = req.body.address;
        if (
          updates.address.location && (
            !Array.isArray(updates.address.location.coordinates) ||
            updates.address.location.coordinates.length !== 2 ||
            updates.address.location.coordinates.some((n) => typeof n !== 'number' || Number.isNaN(n))
          )
        ) {
          delete updates.address.location;
        }
      }
      if (req.body.businessHours !== undefined) updates.businessHours = req.body.businessHours;
      if (req.body.since !== undefined) updates.since = req.body.since;
      if (req.body.metadata || req.body.icon3d || req.body.themeColor) {
        updates.metadata = {
          ...shop.metadata?.toObject?.() || shop.metadata || {},
          ...(req.body.metadata || {}),
          ...(req.body.icon3d ? { icon3d: req.body.icon3d } : {}),
          ...(req.body.themeColor ? { themeColor: req.body.themeColor } : {}),
        };
      }

      const updated = await Shop.findByIdAndUpdate(req.params.id, updates, { new: true });
      return res.json({ success: true, shop: updated });
    } catch (err) {
      console.error('Update shop error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Shop stats: followers, rating
router.get('/:id/stats', async (req, res) => {
  try {
    const shopId = req.params.id;
    const [followers, ratingAgg] = await Promise.all([
      Follow.countDocuments({ shop: shopId }),
      ShopReview.aggregate([
        { $match: { shop: new (require('mongoose').Types.ObjectId)(shopId) } },
        { $group: { _id: '$shop', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);
    const rating = ratingAgg[0] || { avg: 0, count: 0 };
    res.json({ success: true, followers, rating: { average: rating.avg || 0, count: rating.count || 0 } });
  } catch (err) {
    console.error('Shop stats error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List shop reviews (public)
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await ShopReview.find({ shop: req.params.id })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, reviews });
  } catch (err) {
    console.error('List reviews error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create or update a review (authenticated users)
router.post('/:id/reviews', auth(), [body('rating').isInt({ min: 1, max: 5 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const doc = await ShopReview.findOneAndUpdate(
      { shop: req.params.id, user: req.user.id },
      { shop: req.params.id, user: req.user.id, rating: req.body.rating, comment: req.body.comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, review: doc });
  } catch (err) {
    console.error('Create/update review error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== Superadmin/Admin report management =====
// List reports
router.get('/admin/reports', auth(['admin', 'superadmin']), requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const match = {};
    if (status && ['open', 'reviewing', 'resolved'].includes(String(status))) match.status = status;
    const [items, total] = await Promise.all([
      ShopReport.find(match)
        .sort({ createdAt: -1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .populate('shop', 'name slug')
        .populate('reporter', 'username email')
        .lean(),
      ShopReport.countDocuments(match),
    ]);
    res.json({ success: true, reports: items, total, page: p, limit: lim });
  } catch (err) {
    console.error('List shop reports error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get a single report with last 10 messages of its conversation (if any)
router.get('/admin/reports/:id', auth(['admin', 'superadmin']), requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const rep = await ShopReport.findById(req.params.id)
      .populate('shop', 'name slug')
      .populate('reporter', 'username email')
      .lean();
    if (!rep) return res.status(404).json({ success: false, message: 'Report not found' });
    let lastMessages = [];
    if (rep.conversation) {
      lastMessages = await Message.find({ conversation: rep.conversation })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      lastMessages.reverse();
    }
    res.json({ success: true, report: rep, lastMessages });
  } catch (err) {
    console.error('Get report error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a report status
router.put('/admin/reports/:id', auth(['admin', 'superadmin']), requireRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['open', 'reviewing', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const updated = await ShopReport.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report: updated });
  } catch (err) {
    console.error('Update report error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
