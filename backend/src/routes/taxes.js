const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Tax = require('../models/Tax');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

// List taxes by shop
router.get('/', [query('shop').optional().isString()], asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.shop) filter.shop = req.query.shop;
  const items = await Tax.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, taxes: items });
}));

// Get tax
router.get('/:id', asyncHandler(async (req, res) => {
  const item = await Tax.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, tax: item });
}));

// Create
router.post('/',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  [body('shop').isString(), body('name').isString().isLength({ min: 2 }), body('percent').isFloat({ min: 0 })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const shop = await Shop.findById(req.body.shop);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    const isOwner = String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const created = await Tax.create({ shop: req.body.shop, name: req.body.name, percent: req.body.percent, active: req.body.active !== undefined ? !!req.body.active : true });
    res.status(201).json({ success: true, tax: created });
  })
);

// Update
router.put('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const item = await Tax.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });

    const shop = await Shop.findById(item.shop);
    const isOwner = shop && String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updates = (({ name, percent, active }) => ({ name, percent, active }))(req.body);
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updated = await Tax.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, tax: updated });
  })
);

// Delete
router.delete('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  asyncHandler(async (req, res) => {
    const item = await Tax.findById(req.params.id);
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
