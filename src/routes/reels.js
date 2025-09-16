const express = require('express');
const { body, validationResult } = require('express-validator');
const Reel = require('../models/Reel');
const auth = require('../middleware/auth');
const { requirePlan } = require('../middleware/plan');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

router.post('/', auth(['seller', 'admin', 'superadmin']), requirePlan('gold'), [body('shop').isString(), body('media').isString()], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const reel = await Reel.create({ shop: req.body.shop, media: req.body.media, caption: req.body.caption });
  res.status(201).json({ success: true, reel });
}));

router.get('/trending', asyncHandler(async (req, res) => {
  const reels = await Reel.find({}).sort({ likes: -1, createdAt: -1 }).limit(50);
  res.json({ success: true, reels });
}));

module.exports = router;
