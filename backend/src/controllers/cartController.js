const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../utils/async');

async function ensureCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await ensureCart(req.user.id);
  const totals = cart.totals();
  res.json({ success: true, cart: cart.toObject(), totals });
});

exports.addItem = asyncHandler(async (req, res) => {
  const { productId, variantId, qty = 1 } = req.body || {};
  if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const cart = await ensureCart(req.user.id);
  const price = Number(product.price || 0);
  const image = product.mainImage || (Array.isArray(product.images) && product.images[0]) || undefined;

  const existing = cart.items.find(
    (it) => String(it.product) === String(productId) && String(it.variantId || '') === String(variantId || '')
  );
  if (existing) {
    existing.qty += Number(qty || 1);
  } else {
    cart.items.push({
      product: product._id,
      variantId: variantId || undefined,
      title: product.title,
      price,
      qty: Number(qty || 1),
      image,
      shop: product.shopId || undefined,
    });
  }
  await cart.save();
  const totals = cart.totals();
  res.json({ success: true, cart: cart.toObject(), totals });
});

exports.updateQty = asyncHandler(async (req, res) => {
  const { qty } = req.body || {};
  const cart = await ensureCart(req.user.id);
  const item = cart.items.id(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  item.qty = Math.max(1, Number(qty || 1));
  await cart.save();
  const totals = cart.totals();
  res.json({ success: true, cart: cart.toObject(), totals });
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await ensureCart(req.user.id);
  const item = cart.items.id(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
  item.deleteOne();
  await cart.save();
  const totals = cart.totals();
  res.json({ success: true, cart: cart.toObject(), totals });
});

exports.clear = asyncHandler(async (req, res) => {
  const cart = await ensureCart(req.user.id);
  cart.items = [];
  cart.coupon = undefined;
  await cart.save();
  res.json({ success: true, cart: cart.toObject(), totals: cart.totals() });
});

exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body || {};
  const cart = await ensureCart(req.user.id);
  if (!code) {
    cart.coupon = undefined;
    await cart.save();
    return res.json({ success: true, cart: cart.toObject(), totals: cart.totals() });
  }
  const c = await Coupon.findOne({ code, active: true });
  if (!c) return res.status(404).json({ success: false, message: 'Invalid coupon' });
  cart.coupon = code;
  await cart.save();
  const basic = cart.totals();
  let discount = 0;
  if (c.type === 'percent') discount = Math.round(basic.subtotal * (Number(c.value || 0) / 100));
  if (c.type === 'flat') discount = Math.round(Number(c.value || 0));
  const total = Math.max(0, basic.subtotal - discount);
  res.json({ success: true, cart: cart.toObject(), totals: { subtotal: basic.subtotal, discount, total }, coupon: { code, type: c.type, value: c.value } });
});
