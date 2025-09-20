const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Category = require('../models/Category');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

// List categories (by shop)
router.get('/', asyncHandler(async (req, res) => {
  const { shop, q } = req.query;
  const filter = {};
  if (shop) filter.shop = shop;
  if (q) filter.name = new RegExp(q, 'i');
  const items = await Category.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, categories: items });
}));

// Get category
router.get('/:id', asyncHandler(async (req, res) => {
  const item = await Category.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, category: item });
}));

// Create category
router.post('/',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  [
    body('shop').isString(),
    body('name').isString().isLength({ min: 2 }),
    body('parent').optional().isMongoId().withMessage('parent must be a valid id')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const shop = await Shop.findById(req.body.shop);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

    const isOwner = String(shop.owner || shop.ownerId) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const created = await Category.create({
      shop: req.body.shop,
      name: req.body.name,
      description: req.body.description,
      parent: req.body.parent || undefined,
      active: req.body.active !== undefined ? !!req.body.active : true,
    });
    res.status(201).json({ success: true, category: created });
  })
);

// Update category
router.put('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  [
    param('id').isMongoId(),
    body('parent').optional().isMongoId().withMessage('parent must be a valid id'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const item = await Category.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    const shop = await Shop.findById(item.shop);

    const isOwner = shop && String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updates = (({ name, description, parent, active }) => ({ name, description, parent, active }))(req.body);
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updated = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, category: updated });
  })
);

// Delete category
router.delete('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  asyncHandler(async (req, res) => {
    const item = await Category.findById(req.params.id);
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
