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
  // Uploaded files map
  const byField = req.uploadedByField || {};
  if (process.env.NODE_ENV !== 'test') {
    console.log('[posts] uploadedByField keys:', Object.keys(byField));
  }
  // Extract audio URL if uploaded under field 'audio'
  const audioFromUpload = Array.isArray(byField['audio']) && byField['audio'].length ? byField['audio'][0] : undefined;
  // Media: accept 'file' field uploads and any additional 'media' field uploads
  const mediaUploads = [
    ...(Array.isArray(byField['file']) ? byField['file'] : []),
    ...(Array.isArray(byField['media']) ? byField['media'] : []),
  ];
  // Also allow passing media URLs in body
  let media = [];
  if (Array.isArray(req.body.media)) media = req.body.media;
  else if (req.body.media) media = [req.body.media];
  if (mediaUploads.length) media = [...media, ...mediaUploads];

  // Parse hashtags: accept JSON string, array, or comma separated string
  let hashtags;
  if (Array.isArray(req.body.hashtags)) hashtags = req.body.hashtags;
  else if (typeof req.body.hashtags === 'string') {
    try {
      const parsed = JSON.parse(req.body.hashtags);
      if (Array.isArray(parsed)) hashtags = parsed;
      else hashtags = req.body.hashtags.split(',').map(s=>s.trim()).filter(Boolean);
    } catch {
      hashtags = req.body.hashtags.split(',').map(s=>s.trim()).filter(Boolean);
    }
  }

  const post = await Post.create({
    shop: req.body.shop,
    product: req.body.product,
    caption: req.body.caption,
    media,
    audio: req.body.audio || audioFromUpload,
    hashtags,
    type: req.body.type || 'product',
    status: req.body.status || 'active',
  });
  res.status(201).json({ success: true, post });
}));

// List posts (public), with optional filters: shop, status, limit
router.get('/', asyncHandler(async (req, res) => {
  const { shop, status, limit } = req.query;
  const q = {};
  if (shop) q.shop = shop;
  if (status) {
    if (status === 'active') {
      // include legacy posts without status
      q.$or = [{ status: 'active' }, { status: { $exists: false } }]
    } else {
      q.status = status;
    }
  }
  const lim = Math.min(parseInt(limit || '50', 10) || 50, 100);
  const posts = await Post.find(q)
    .sort({ createdAt: -1 })
    .limit(lim)
    .populate('shop', 'name slug logo isVerified')
    .populate('product', 'title mainImage images price')
    .lean();
  res.json({ success: true, posts });
}));

// Update a post (seller/admin). Supports updating fields and replacing/adding media via multipart
router.put('/:id', auth(['seller', 'admin', 'superadmin']), upload.any(), attachUploads, asyncHandler(async (req, res) => {
  const byField = req.uploadedByField || {};
  const audioFromUpload = Array.isArray(byField['audio']) && byField['audio'].length ? byField['audio'][0] : undefined;
  const mediaUploads = [
    ...(Array.isArray(byField['file']) ? byField['file'] : []),
    ...(Array.isArray(byField['media']) ? byField['media'] : []),
  ];

  // Parse hashtags
  let hashtags;
  if (Array.isArray(req.body.hashtags)) hashtags = req.body.hashtags;
  else if (typeof req.body.hashtags === 'string') {
    try {
      const parsed = JSON.parse(req.body.hashtags);
      if (Array.isArray(parsed)) hashtags = parsed;
      else hashtags = req.body.hashtags.split(',').map(s=>s.trim()).filter(Boolean);
    } catch {
      hashtags = req.body.hashtags.split(',').map(s=>s.trim()).filter(Boolean);
    }
  }

  const update = {};
  ['shop','product','caption','type','status'].forEach((k) => {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  });
  if (hashtags !== undefined) update['hashtags'] = hashtags;
  if (audioFromUpload) update['audio'] = audioFromUpload;
  else if (req.body.audio !== undefined) update['audio'] = req.body.audio || undefined;

  // media: if client sends mediaReset=true, replace with uploads/body; else if uploads provided, append
  let newMedia = undefined;
  if (req.body.mediaReset === 'true') {
    newMedia = [];
    if (Array.isArray(req.body.media)) newMedia = req.body.media;
    else if (req.body.media) newMedia = [req.body.media];
    if (mediaUploads.length) newMedia = [...newMedia, ...mediaUploads];
  } else if (mediaUploads.length) {
    // append uploads to existing
    const existing = (await Post.findById(req.params.id))?.media || [];
    newMedia = [...existing, ...mediaUploads];
  }
  if (newMedia !== undefined) update['media'] = newMedia;

  const post = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, post });
}));

// Set status only (active/draft/archived)
router.patch('/:id/status', auth(['seller', 'admin', 'superadmin']), [body('status').isString()], asyncHandler(async (req, res) => {
  const { status } = req.body;
  const post = await Post.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json({ success: true, post });
}));

// Delete a post
router.delete('/:id', auth(['seller', 'admin', 'superadmin']), asyncHandler(async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ success: true });
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

