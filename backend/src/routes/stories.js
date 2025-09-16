const express = require('express');
const { body, validationResult } = require('express-validator');
const Story = require('../models/Story');
const auth = require('../middleware/auth');
const { requirePlan } = require('../middleware/plan');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

router.post('/', auth(['seller', 'admin', 'superadmin']), requirePlan('silver'), [body('shop').isString(), body('media').isString()], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + 24 * 3600 * 1000);
  const story = await Story.create({ shop: req.body.shop, media: req.body.media, cta: req.body.cta, expiresAt });
  res.status(201).json({ success: true, story });
}));

router.get('/:shopId', asyncHandler(async (req, res) => {
  const now = new Date();
  const stories = await Story.find({ shop: req.params.shopId, expiresAt: { $gte: now } }).sort({ createdAt: -1 });
  res.json({ success: true, stories });
}));

module.exports = router;
