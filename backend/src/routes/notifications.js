const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

// List notifications for current user
router.get('/', auth(), asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ user: req.user.id }),
  ]);
  res.json({ success: true, items, total, page, limit });
}));

// Mark a single notification as read
router.post('/mark-read', auth(), asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: 'id required' });
  const n = await Notification.findOneAndUpdate({ _id: id, user: req.user.id }, { readAt: new Date() }, { new: true });
  res.json({ success: true, notification: n });
}));

// Mark all as read
router.post('/mark-all-read', auth(), asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, readAt: { $exists: false } }, { readAt: new Date() });
  res.json({ success: true });
}));

module.exports = router;
