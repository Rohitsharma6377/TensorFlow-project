const express = require('express');
const { body, validationResult } = require('express-validator');
const Story = require('../models/Story');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const Notification = require('../models/Notification');
const Follow = require('../models/Follow');
const Shop = require('../models/Shop');

const router = express.Router();

router.post('/', auth(), [body('shop').isString(), body('media').isString()], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + 24 * 3600 * 1000);
  const story = await Story.create({ shop: req.body.shop, media: req.body.media, cta: req.body.cta, product: req.body.product, expiresAt });
  // Notify followers of shop about new story
  try {
    const followers = await Follow.find({ shop: req.body.shop }).select('follower').lean();
    const items = followers.map(f => ({ user: f.follower, type: 'story_new', shop: req.body.shop, story: story._id }));
    if (items.length) await Notification.insertMany(items);
  } catch {}
  res.status(201).json({ success: true, story });
}));

router.get('/:shopId', asyncHandler(async (req, res) => {
  const now = new Date();
  const stories = await Story.find({ shop: req.params.shopId, expiresAt: { $gte: now } })
    .sort({ createdAt: -1 })
    .populate('product', '_id title mainImage images price');
  res.json({ success: true, stories });
}));

// Record a story view (unique per user)
router.post('/:id/view', auth(), asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
  const already = story.viewers?.some((u) => String(u) === String(userId));
  if (!already) {
    story.viewers = [...(story.viewers || []), userId];
    story.viewsCount = (story.viewsCount || 0) + 1;
    await story.save();
  }
  res.json({ success: true, viewed: true, story });
}));

// Like / Unlike a story (toggle)
router.post('/:id/like', auth(), asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
  const hasLiked = story.likedBy?.some((u) => String(u) === String(userId));
  if (hasLiked) {
    story.likedBy = story.likedBy.filter((u) => String(u) !== String(userId));
    story.likesCount = Math.max(0, (story.likesCount || 0) - 1);
  } else {
    story.likedBy = [...(story.likedBy || []), userId];
    story.likesCount = (story.likesCount || 0) + 1;
  }
  await story.save();
  // Notify shop owner on like
  try {
    const shop = await Shop.findById(story.shop).select('ownerId');
    if (shop?.ownerId && !hasLiked) await Notification.create({ user: shop.ownerId, type: 'story_like', actor: userId, story: story._id, shop: story.shop });
  } catch {}
  res.json({ success: true, liked: !hasLiked, story });
}));

module.exports = router;
