const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');

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

// List payouts (admin)
router.get('/payouts', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(parseInt(limit, 10) || 50, 100);
  const [items, total] = await Promise.all([
    Payout.find({}).sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
    Payout.countDocuments({}),
  ]);
  res.json({ success: true, payouts: items, total, page: p, limit: lim });
}));

// Notify a user (store notification; email/SMS integration can be added via a service)
router.post('/users/:id/notify', auth(['admin', 'superadmin']), requireAdmin, [
  body('channel').isIn(['email', 'sms']).withMessage('channel must be email or sms'),
  body('message').isString().isLength({ min: 1 }).withMessage('message required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const n = await Notification.create({ user: user._id, title: 'Admin Message', body: req.body.message, meta: { channel: req.body.channel } });
  res.json({ success: true, notification: n });
}));

// List premium members (basic: read subscriptions and map to users)
router.get('/premium-members', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const subs = await Subscription.find({}).sort({ createdAt: -1 }).limit(200).lean();
  const userIds = [...new Set(subs.map(s => String(s.user || s.userId)).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).select('username email profile.fullName').lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));
  const members = subs.map(s => ({
    id: String(s._id),
    userId: String(s.user || s.userId),
    name: userMap.get(String(s.user || s.userId))?.profile?.fullName || userMap.get(String(s.user || s.userId))?.username || 'User',
    email: userMap.get(String(s.user || s.userId))?.email,
    tier: s.tier || s.plan || 'silver',
    renewal: s.renewal || s.expiresAt || s.renewAt || null,
    status: (s.expiresAt && new Date(s.expiresAt) < new Date()) ? 'expired' : 'active',
  }));
  res.json({ success: true, members });
}));

module.exports = router;
