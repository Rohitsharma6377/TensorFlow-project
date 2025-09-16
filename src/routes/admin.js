const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Payout = require('../models/Payout');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  next();
}

// Ban/Unban user
router.post('/users/:id/ban', auth(['admin', 'superadmin']), requireAdmin, [body('ban').isBoolean()], asyncHandler(async (req, res) => {
  const { ban } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: !!ban }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// Approve/Reject KYC for user (seller)
router.post('/users/:id/kyc', auth(['admin', 'superadmin']), requireAdmin, [body('status').isIn(['approved','rejected','pending'])], asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { kycStatus: req.body.status }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// Verify/Unverify shop and ban/unban
router.post('/shops/:id/verify', auth(['admin', 'superadmin']), requireAdmin, [body('verified').isBoolean()], asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { verified: !!req.body.verified }, { new: true });
  if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
  res.json({ success: true, shop });
}));

router.post('/shops/:id/ban', auth(['admin', 'superadmin']), requireAdmin, [body('ban').isBoolean()], asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { isBanned: !!req.body.ban }, { new: true });
  if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
  res.json({ success: true, shop });
}));

// Approve payout manually (simulate transfer)
router.post('/payouts/:id/approve', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const payout = await Payout.findByIdAndUpdate(req.params.id, { status: 'paid', paidAt: new Date() }, { new: true });
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  res.json({ success: true, payout });
}));

module.exports = router;
