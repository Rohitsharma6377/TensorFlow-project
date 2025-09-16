const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const Shop = require('../models/Shop');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

// Create report (any authenticated user)
router.post('/', auth(), [body('targetType').isString(), body('targetId').isString(), body('reason').isString()], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const report = await Report.create({ reporter: req.user.id, targetType: req.body.targetType, targetId: req.body.targetId, reason: req.body.reason, evidence: req.body.evidence || [] });
  res.status(201).json({ success: true, report });
}));

// Admin list reports
router.get('/', auth(['admin', 'superadmin']), asyncHandler(async (req, res) => {
  const reports = await Report.find({}).sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, reports });
}));

// Admin moderation action
// POST /api/v1/reports/:id/action { status: 'in_review'|'resolved'|'rejected', trustDelta?: number }
router.post('/:id/action', auth(['admin', 'superadmin']), [body('status').isString()], asyncHandler(async (req, res) => {
  const { status, trustDelta = 0 } = req.body;
  const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

  // Adjust trust score if the target is a shop or if product-related (adjust owning shop)
  if (trustDelta && report.targetType === 'shop') {
    await Shop.findByIdAndUpdate(report.targetId, { $inc: { trustScore: trustDelta } });
  }

  res.json({ success: true, report });
}));

module.exports = router;
