const express = require('express');
const { body, validationResult } = require('express-validator');
const Tag = require('../models/Tag');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

// List tags (by shop)
router.get('/', asyncHandler(async (req, res) => {
  const { shop, q } = req.query;
  const filter = {};
  if (shop) filter.shop = shop;
  if (q) filter.name = new RegExp(q, 'i');
  const items = await Tag.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, tags: items });
}));

// Get tag
router.get('/:id', asyncHandler(async (req, res) => {
  const item = await Tag.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, tag: item });
}));

// Create tag
router.post('/',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  [
    body('shop').isString(),
    body('name').isString().isLength({ min: 1 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const shop = await Shop.findById(req.body.shop);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const isOwner = String(shop.owner || shop.ownerId) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const created = await Tag.create({
      shop: req.body.shop,
      name: req.body.name,
      description: req.body.description,
      active: req.body.active !== undefined ? !!req.body.active : true,
    });
    res.status(201).json({ success: true, tag: created });
  })
);

// Update tag
router.put('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  asyncHandler(async (req, res) => {
    const item = await Tag.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    const shop = await Shop.findById(item.shop);

    const isOwner = shop && String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updates = (({ name, description, active }) => ({ name, description, active }))(req.body);
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updated = await Tag.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, tag: updated });
  })
);

// Delete tag
router.delete('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  asyncHandler(async (req, res) => {
    const item = await Tag.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    const shop = await Shop.findById(item.shop);

    const isOwner = shop && String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    await item.deleteOne();
    res.json({ success: true });
  })
);

module.exports = router;
