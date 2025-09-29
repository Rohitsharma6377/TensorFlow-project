const WishlistCollection = require('../models/WishlistCollection');
const { asyncHandler } = require('../utils/async');

exports.list = asyncHandler(async (req, res) => {
  const cols = await WishlistCollection.find({ user: req.user.id }).populate('items.product');
  res.json({ success: true, collections: cols });
});

exports.create = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Name required' });
  const created = await WishlistCollection.create({ user: req.user.id, name: String(name).trim(), items: [] });
  res.json({ success: true, collection: created });
});

exports.rename = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  const col = await WishlistCollection.findOne({ _id: req.params.id, user: req.user.id });
  if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });
  col.name = String(name || col.name);
  await col.save();
  res.json({ success: true, collection: col });
});

exports.remove = asyncHandler(async (req, res) => {
  const col = await WishlistCollection.findOne({ _id: req.params.id, user: req.user.id });
  if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });
  await col.deleteOne();
  res.json({ success: true });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  const col = await WishlistCollection.findOne({ _id: req.params.id, user: req.user.id });
  if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });
  if (!productId) return res.status(400).json({ success: false, message: 'productId required' });
  if (!col.items.find((i) => String(i.product) === String(productId))) {
    col.items.push({ product: productId });
  }
  await col.save();
  res.json({ success: true, collection: col });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  const col = await WishlistCollection.findOne({ _id: req.params.id, user: req.user.id });
  if (!col) return res.status(404).json({ success: false, message: 'Collection not found' });
  col.items = col.items.filter((i) => String(i.product) !== String(productId));
  await col.save();
  res.json({ success: true, collection: col });
});
