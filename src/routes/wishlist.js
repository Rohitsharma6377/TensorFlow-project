const express = require('express');
const { asyncHandler } = require('../utils/async');
const auth = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');

const router = express.Router();

// POST /api/v1/products/:id/wishlist (mounted under /api/v1)
router.post('/products/:id/wishlist', auth(), asyncHandler(async (req, res) => {
  await Wishlist.findOneAndUpdate({ user: req.user.id, product: req.params.id }, { user: req.user.id, product: req.params.id }, { upsert: true });
  res.json({ success: true });
}));

// GET /api/v1/users/:id/wishlist
router.get('/users/:id/wishlist', auth(), asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && !['admin','superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const items = await Wishlist.find({ user: req.params.id }).populate('product');
  res.json({ success: true, wishlist: items });
}));

module.exports = router;
