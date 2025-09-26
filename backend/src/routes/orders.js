const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Escrow = require('../models/Escrow');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { chain, Transaction } = require('../web3/blockchain');

const router = express.Router();

// Checkout: create order + escrow (simplified)
router.post('/checkout', auth(), [body('items').isArray({ min: 1 }), body('totalAmount').isFloat({ gt: 0 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const order = await Order.create({
      customer: req.user.id,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      status: 'created',
    });
    const allocMap = new Map();
    for (const it of req.body.items) {
      const amount = (it.price || 0) * (it.qty || 1);
      allocMap.set(it.shop, (allocMap.get(it.shop) || 0) + amount);
    }
    const allocations = Array.from(allocMap.entries()).map(([shop, amount]) => ({ shop, amount }));
    const escrow = await Escrow.create({ order: order._id, totalAmount: req.body.totalAmount, allocations });
    // Reward coins to user's wallet (optional demo): 1% of total as reward
    try {
      const user = await User.findById(req.user.id);
      if (user && user.walletAddress) {
        const reward = Math.max(0, Number(req.body.totalAmount) * 0.01);
        if (reward > 0) {
          const rewardTx = new Transaction(null, user.walletAddress, reward);
          chain.addBlock([rewardTx]);
        }
      }
    } catch (e) {
      console.error('Blockchain reward failed (non-fatal):', e.message);
    }
    res.status(201).json({ success: true, order, escrow });
  } catch (err) {
    console.error('Checkout error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get an order
router.get('/:id', auth(), async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product items.shop');
  if (!order) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, order });
});

module.exports = router;

// Seller analytics: totals
router.get('/seller/stats', auth(['seller','admin','superadmin']), async (req, res) => {
  try {
    const { shop, sinceHours = 720 } = req.query; // default last 30 days
    if (!shop) return res.status(400).json({ success: false, message: 'shop is required' });
    const since = new Date(Date.now() - Number(sinceHours) * 3600 * 1000);
    const pipeline = [
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $match: { 'items.shop': shop } },
      { $group: {
          _id: null,
          orders: { $addToSet: '$_id' },
          itemsCount: { $sum: { $ifNull: ['$items.qty', 1] } },
          revenue: { $sum: { $multiply: [ { $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.qty', 1] } ] } },
          delivered: { $sum: { $cond: [{ $eq: ['$items.status', 'delivered'] }, 1, 0] } },
        }
      },
      { $project: { _id: 0, totalOrders: { $size: '$orders' }, totalItems: '$itemsCount', revenue: 1, delivered: 1 } }
    ];
    const agg = await Order.aggregate(pipeline);
    const stats = agg[0] || { totalOrders: 0, totalItems: 0, revenue: 0, delivered: 0 };
    res.json({ success: true, stats });
  } catch (err) {
    console.error('seller stats error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Seller analytics: time series (zig-zag chart data)
router.get('/seller/series', auth(['seller','admin','superadmin']), async (req, res) => {
  try {
    const { shop, windowHours = 24, intervalMinutes = 60 } = req.query;
    if (!shop) return res.status(400).json({ success: false, message: 'shop is required' });
    const since = new Date(Date.now() - Number(windowHours) * 3600 * 1000);

    // Group by interval bucket
    const bucketMs = Number(intervalMinutes) * 60 * 1000;
    const pipeline = [
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $match: { 'items.shop': shop } },
      { $project: {
          ts: {
            $toDate: { $subtract: [ { $toLong: '$createdAt' }, { $mod: [ { $toLong: '$createdAt' }, bucketMs ] } ] }
          },
          revenue: { $multiply: [ { $ifNull: ['$items.price', 0] }, { $ifNull: ['$items.qty', 1] } ] },
          one: 1,
        }
      },
      { $group: { _id: '$ts', orders: { $sum: '$one' }, revenue: { $sum: '$revenue' } } },
      { $project: { _id: 0, t: '$_id', orders: 1, revenue: 1 } },
      { $sort: { t: 1 } }
    ];
    const points = await Order.aggregate(pipeline);
    res.json({ success: true, points });
  } catch (err) {
    console.error('seller series error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
