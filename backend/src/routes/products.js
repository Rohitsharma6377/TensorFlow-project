const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/async');
const { upload, attachUploads } = require('../middleware/uploadAttach');
const { cache } = require('../middleware/cache');
const { delByPrefix } = require('../utils/redis');

const router = express.Router();

// Create product (seller: must own the shop)
router.post(
  '/',
  auth(['seller', 'admin', 'superadmin']),
  requireRole(['seller', 'admin', 'superadmin']),
  upload.any(),
  attachUploads,
  [
    body('shopId').isString(),
    body('title').isString().isLength({ min: 2 }),
    body('price').isFloat({ gt: 0 }),
    body('stock').optional().isInt({ min: 0 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const shop = await Shop.findById(req.body.shopId);
      if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });

      const isOwner = String(shop.ownerId) === String(req.user.id);
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
      if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

      const images = (req.body.images && Array.isArray(req.body.images))
        ? req.body.images
        : (req.uploadedUrls?.length ? req.uploadedUrls : (req.body.images ? [req.body.images] : []));

      const product = await Product.create({
        shopId: req.body.shopId,
        title: req.body.title,
        sku: req.body.sku,
        description: req.body.description,
        price: req.body.price,
        taxRate: req.body.taxRate || 0,
        stock: req.body.stock || 0,
        images,
        attributes: req.body.attributes || {},
        status: req.body.status || 'active',
      });
      // Invalidate caches for product lists and details
      delByPrefix('cache:GET:/api/v1/products');
      return res.status(201).json({ success: true, product });
    } catch (err) {
      console.error('Create product error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  })
);

// Public list/search products
router.get('/', cache(60), asyncHandler(async (req, res) => {
  const { q, shopId, status, category, price_min, price_max, sort, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (shopId) filter.shopId = shopId;
  if (status) filter.status = status;
  if (category) filter.category = category;
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
  return res.json({ success: true, products: items });
}));

// Get product by id
router.get('/:id', cache(60), asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, product: p });
}));

// Update product (owner/admin)
router.put(
  '/:id',
  auth(['seller', 'admin', 'superadmin']),
  requireRole(['seller', 'admin', 'superadmin']),
  upload.any(),
  attachUploads,
  asyncHandler(async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      const shop = await Shop.findById(product.shopId);

      const isOwner = shop && String(shop.ownerId) === String(req.user.id);
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
      if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

      let images = (req.body.images && Array.isArray(req.body.images)) ? req.body.images : (req.uploadedUrls?.length ? req.uploadedUrls : undefined);
      const updates = (({ title, sku, description, price, taxRate, stock, attributes, status }) => ({
        title,
        sku,
        description,
        price,
        taxRate,
        stock,
        attributes,
        status,
      }))(req.body);
      if (images !== undefined) updates.images = images;
      Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

      const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
      // Invalidate caches for this product and lists
      delByPrefix(`cache:GET:/api/v1/products/${req.params.id}`);
      delByPrefix('cache:GET:/api/v1/products');
      return res.json({ success: true, product: updated });
    } catch (err) {
      console.error('Update product error', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  })
);

// Delete product
router.delete(
  '/:id',
  auth(['seller', 'admin', 'superadmin']),
  requireRole(['seller', 'admin', 'superadmin']),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    const shop = await Shop.findById(product.shopId);
    const isOwner = shop && String(shop.ownerId) === String(req.user.id);
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });
    await product.deleteOne();
    // Invalidate caches for this product and lists
    delByPrefix(`cache:GET:/api/v1/products/${req.params.id}`);
    delByPrefix('cache:GET:/api/v1/products');
    res.json({ success: true });
  })
);

module.exports = router;
