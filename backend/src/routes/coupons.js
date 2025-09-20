const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Coupon = require('../models/Coupon');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

// List coupons by shop
router.get('/', [query('shop').optional().isString()], asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.shop) filter.shop = req.query.shop;
  const items = await Coupon.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, coupons: items });
}));

// Get coupon
router.get('/:id', asyncHandler(async (req, res) => {
  const item = await Coupon.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, coupon: item });
}));

// Create
router.post('/',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  [
    body('shop').isString(),
    body('code').isString().isLength({ min: 2 }),
    body('type').isIn(['percent','fixed']),
    body('value').isFloat({ min: 0 }),
    body('expiry').optional().isISO8601(),
    body('usageLimit').optional().isInt({ min: 0 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const shop = await Shop.findById(req.body.shop);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    const isOwner = String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const created = await Coupon.create({
      shop: req.body.shop,
      code: req.body.code.trim(),
      type: req.body.type,
      value: req.body.value,
      expiry: req.body.expiry ? new Date(req.body.expiry) : undefined,
      usageLimit: req.body.usageLimit,
      active: req.body.active !== undefined ? !!req.body.active : true,
    });
    res.status(201).json({ success: true, coupon: created });
  })
);

// Update
router.put('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const item = await Coupon.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });

    const shop = await Shop.findById(item.shop);
    const isOwner = shop && String((shop.owner || shop.ownerId)) === String(req.user.id);
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updates = (({ code, type, value, expiry, usageLimit, active }) => ({ code, type, value, expiry, usageLimit, active }))(req.body);
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updated = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, coupon: updated });
  })
);

// Delete
router.delete('/:id',
  auth(['seller','admin','superadmin']),
  requireRole(['seller','admin','superadmin']),
  asyncHandler(async (req, res) => {
    const item = await Coupon.findById(req.params.id);
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
