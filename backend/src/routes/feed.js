const express = require('express');
const { asyncHandler } = require('../utils/async');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/feed - personalized feed (followed shops + trending fallback)
router.get('/', auth(), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const follows = await Follow.find({ follower: userId }).select('shop');
  const shopIds = follows.map(f => f.shop);

  let posts = [];
  if (shopIds.length) {
    posts = await Post.find({ shop: { $in: shopIds } })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  // Trending fallback if not enough
  if (posts.length < 20) {
    const trending = await Post.find({})
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(20 - posts.length);
    posts = posts.concat(trending);
  }

  res.json({ success: true, posts });
}));

module.exports = router;
