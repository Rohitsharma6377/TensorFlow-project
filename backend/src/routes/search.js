const express = require('express');
const { asyncHandler } = require('../utils/async');
const Product = require('../models/Product');
const Post = require('../models/Post');

const router = express.Router();

// GET /api/v1/search/products?q=&category=&shopId=&price_min=&price_max=&sort=&page=&limit=
router.get('/products', asyncHandler(async (req, res) => {
  const { q, category, shopId, price_min, price_max, sort, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (shopId) filter.shopId = shopId;
  if (price_min || price_max) {
    filter.price = {};
    if (price_min) filter.price.$gte = Number(price_min);
    if (price_max) filter.price.$lte = Number(price_max);
  }
  const sortMap = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } };
  const sortBy = sortMap[sort] || { createdAt: -1 };
  const items = await Product.find(filter)
    .sort(sortBy)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  res.json({ success: true, products: items });
}));

// GET /api/v1/search/posts?q=&shopId=&page=&limit=
router.get('/posts', asyncHandler(async (req, res) => {
  const { q, shopId, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (shopId) filter.shop = shopId;
  const items = await Post.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  res.json({ success: true, posts: items });
}));

module.exports = router;
