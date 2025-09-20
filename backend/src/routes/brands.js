const express = require('express');
const { body, validationResult } = require('express-validator');
const Brand = require('../models/Brand');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/async');
const { upload, attachUploads } = require('../middleware/uploadAttach');

const router = express.Router();

// List brands (by shop)
router.get('/', asyncHandler(async (req, res) => {
  const { shop, q } = req.query;
  const filter = {};
  if (shop) filter.shop = shop;
  if (q) filter.name = new RegExp(q, 'i');
  const items = await Brand.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, brands: items });
}));

// Get brand by id
router.get('/:id', asyncHandler(async (req, res) => {
  const item = await Brand.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, brand: item });
}));

// Create brand
router.post('/',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  upload.any(),
  attachUploads,
  [
    body('shop').isString(),
    body('name').isString().isLength({ min: 2 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const shop = await Shop.findById(req.body.shop);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const isOwner = String(shop.owner || shop.ownerId) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const logo = req.uploadedUrls && req.uploadedUrls[0] ? req.uploadedUrls[0] : req.body.logo;

    const created = await Brand.create({
      shop: req.body.shop,
      name: req.body.name,
      description: req.body.description,
      logo,
      active: req.body.active !== undefined ? !!req.body.active : true,
    });
    res.status(201).json({ success: true, brand: created });
  })
);

// Update brand
router.put('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  upload.any(),
  attachUploads,
  asyncHandler(async (req, res) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Not found' });
    const shop = await Shop.findById(brand.shop);

    const isOwner = shop && String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updates = (({ name, description, active }) => ({ name, description, active }))(req.body);
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    const logo = req.uploadedUrls && req.uploadedUrls[0] ? req.uploadedUrls[0] : undefined;
    if (logo) updates.logo = logo;

    const updated = await Brand.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, brand: updated });
  })
);

// Delete brand
router.delete('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  asyncHandler(async (req, res) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Not found' });
    const shop = await Shop.findById(brand.shop);

    const isOwner = shop && String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    await brand.deleteOne();
    res.json({ success: true });
  })
);

module.exports = router;
