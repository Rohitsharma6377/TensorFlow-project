const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

// Create a shop (seller only)
router.post(
  '/',
  auth(['seller', 'admin', 'superadmin']),
  requireRole(['seller', 'admin', 'superadmin']),
  [
    body('shopName').isString().isLength({ min: 2 }),
    body('slug').isString().isLength({ min: 2 }).toLowerCase(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const existing = await Shop.findOne({ slug: req.body.slug });
      if (existing) return res.status(400).json({ success: false, message: 'Slug already in use' });

      const shop = await Shop.create({
        ownerId: req.user.id,
        shopName: req.body.shopName,
        slug: req.body.slug,
        bio: req.body.bio,
        logoUrl: req.body.logoUrl,
        location: req.body.location,
        categories: req.body.categories || [],
        planType: req.body.planType || null,
      });
      return res.status(201).json({ success: true, shop });
    } catch (err) {
      console.error('Create shop error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Get shop by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const shop = await Shop.findOne({ slug: req.params.slug });
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

      const isOwner = String(shop.ownerId) === String(req.user.id);
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
      if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

      const updates = (({ shopName, bio, logoUrl, location, categories, planType, verified }) => ({
        shopName,
        bio,
        logoUrl,
        location,
        categories,
        planType,
        verified,
      }))(req.body);

      Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

      const updated = await Shop.findByIdAndUpdate(req.params.id, updates, { new: true });
      return res.json({ success: true, shop: updated });
    } catch (err) {
      console.error('Update shop error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
