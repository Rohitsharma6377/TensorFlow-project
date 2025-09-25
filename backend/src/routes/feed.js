const express = require('express');
const { asyncHandler } = require('../utils/async');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const Like = require('../models/Like');
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
      .limit(50)
      .populate('shop', 'name slug logo isVerified')
      .populate('product', 'title mainImage images price')
      .lean();
  }

  // Trending fallback if not enough
  if (posts.length < 20) {
    const trending = await Post.find({})
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(20 - posts.length)
      .populate('shop', 'name slug logo isVerified')
      .populate('product', 'title mainImage images price')
      .lean();
    posts = posts.concat(trending);
  }

  // Attach isLiked per post and isFollowing per shop
  const postIds = posts.map(p => p._id);
  const likeDocs = await Like.find({ user: userId, post: { $in: postIds } }).select('post').lean();
  const likedSet = new Set(likeDocs.map(l => String(l.post)));
  const followingSet = new Set(shopIds.map(id => String(id)));
  const enriched = posts.map(p => ({
    ...p,
    isLiked: likedSet.has(String(p._id)),
    shop: p.shop ? { ...p.shop, isFollowing: p.shop._id ? followingSet.has(String(p.shop._id)) : followingSet.has(String(p.shop)) } : undefined,
  }));

  res.json({ success: true, posts: enriched });
}));

module.exports = router;
