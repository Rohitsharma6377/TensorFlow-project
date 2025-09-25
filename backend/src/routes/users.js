const express = require('express');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const User = require('../models/User');

const router = express.Router();

// Update current user's profile
router.put('/me', auth(), asyncHandler(async (req, res) => {
  const updates = (({ profilePic, profile, walletBalance }) => ({ profilePic, profile, walletBalance }))(req.body || {});
  Object.keys(updates).forEach((k)=> updates[k] === undefined && delete updates[k]);
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// Update profile (owner only)
router.put('/:id', auth(), [param('id').isString()], asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && !['admin','superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const updates = (({ profilePic, profile, walletBalance }) => ({ profilePic, profile, walletBalance }))(req.body || {});
  Object.keys(updates).forEach((k)=> updates[k] === undefined && delete updates[k]);
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// Admin list users
router.get('/', auth(['admin','superadmin']), asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-passwordHash').limit(200).sort({ createdAt: -1 });
  res.json({ success: true, users });
}));

// Addresses CRUD
router.post('/:id/address', auth(), [param('id').isString(), body('address').isObject()], asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && !['admin','superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const addr = req.body.address;
  addr.id = addr.id || String(Date.now());
  const user = await User.findByIdAndUpdate(req.params.id, { $push: { addresses: addr } }, { new: true }).select('-passwordHash');
  res.json({ success: true, user });
}));

router.put('/:id/address/:aid', auth(), [param('id').isString(), param('aid').isString()], asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && !['admin','superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const updates = req.body.address || {};
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, 'addresses.id': req.params.aid },
    { $set: { 'addresses.$': { ...updates, id: req.params.aid } } },
    { new: true }
  ).select('-passwordHash');
  if (!user) return res.status(404).json({ success: false, message: 'Address not found' });
  res.json({ success: true, user });
}));

router.delete('/:id/address/:aid', auth(), [param('id').isString(), param('aid').isString()], asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && !['admin','superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { $pull: { addresses: { id: req.params.aid } } }, { new: true }).select('-passwordHash');
  res.json({ success: true, user });
}));

module.exports = router;
