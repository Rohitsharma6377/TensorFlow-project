const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const { upload, attachUploads } = require('../middleware/uploadAttach');

const router = express.Router();

// Create post (seller)
router.post('/', auth(['seller', 'admin', 'superadmin']), upload.any(), attachUploads, [body('shop').isString()], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const media = (req.body.media && Array.isArray(req.body.media)) ? req.body.media : (req.uploadedUrls?.length ? req.uploadedUrls : (req.body.media ? [req.body.media] : []));
  const post = await Post.create({
    shop: req.body.shop,
    product: req.body.product,
    caption: req.body.caption,
    media,
    type: req.body.type || 'product',
  });
  res.status(201).json({ success: true, post });
}));

// List posts (public)
router.get('/', asyncHandler(async (req, res) => {
  const posts = await Post.find({}).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, posts });
}));

// Like a post
router.post('/:id/like', auth(), asyncHandler(async (req, res) => {
  await Like.findOneAndUpdate(
    { user: req.user.id, post: req.params.id },
    { user: req.user.id, post: req.params.id },
    { upsert: true }
  );
  await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: 1 } });
  res.json({ success: true });
}));

// Comment on post
router.post('/:id/comment', auth(), [body('text').isString().isLength({ min: 1 })], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const c = await Comment.create({ user: req.user.id, post: req.params.id, text: req.body.text, parent: req.body.parent });
  await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
  res.json({ success: true, comment: c });
}));

module.exports = router;
