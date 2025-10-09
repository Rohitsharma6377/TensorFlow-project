const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');
let WalletAddress; try { WalletAddress = require('../models/WalletAddress') } catch {}
const chain = (()=>{ try { return require('../web3/blockchain').chain } catch { return null } })();

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  next();
}

// Test endpoint to verify backend is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend admin API is working!', 
    timestamp: new Date().toISOString(),
    authenticated: !!req.user,
    userRole: req.user?.role || 'none'
  });
});

// Ban/Unban user
router.post('/users/:id/ban', auth(['admin', 'superadmin']), requireAdmin, [body('ban').isBoolean()], asyncHandler(async (req, res) => {
  const { ban } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: !!ban }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// Orders list with filters and sum (admin)
router.get('/orders', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, q = '', from, to } = req.query || {};
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(parseInt(limit, 10) || 20, 100);
  const filter = {};
  if (status) filter.status = status;
  if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };

  // Basic q search on customer email/username via populate, fallback to _id
  const regex = q ? new RegExp(String(q), 'i') : null;

  const query = Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((p - 1) * lim)
    .limit(lim)
    .populate({ path: 'customer', select: 'email username profile.fullName' })
    .populate({ path: 'items.shop', select: 'name slug' });

  let items = await query.lean();
  if (regex) {
    items = items.filter((o) =>
      regex.test(String(o._id)) ||
      regex.test(o.customer?.email || '') ||
      regex.test(o.customer?.username || '') ||
      regex.test(o.customer?.profile?.fullName || '') ||
      (Array.isArray(o.items) && o.items.some((it) => regex.test(it?.shop?.name || '') || regex.test(it?.shop?.slug || '')))
    );
  }

  const total = await Order.countDocuments(filter);
  const sumAgg = await Order.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const sum = Number(sumAgg?.[0]?.total || 0);

  // map to frontend-friendly rows (minimal)
  const orders = items.map((o) => ({
    _id: String(o._id),
    customer: o.customer ? {
      id: String(o.customer._id || ''),
      name: o.customer?.profile?.fullName || o.customer?.username || o.customer?.email || 'User',
      email: o.customer?.email,
    } : undefined,
    shop: Array.isArray(o.items) && o.items[0]?.shop ? {
      id: String(o.items[0].shop._id || ''),
      name: o.items[0].shop?.name,
      slug: o.items[0].shop?.slug,
    } : undefined,
    amount: o.totalAmount,
    status: o.status,
    createdAt: o.createdAt,
  }));

  res.json({ success: true, orders, total, page: p, limit: lim, sum });
}));

// List users (search, pagination, role, status, date range)
router.get('/users', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q = '', role, status, from, to } = req.query || {};
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(parseInt(limit, 10) || 20, 100);
  const filter = {};
  if (q) {
    filter.$or = [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { 'profile.fullName': { $regex: q, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;
  if (status === 'banned') filter.isBanned = true;
  if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).select('username email role isBanned profile.fullName createdAt').lean(),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users: items, total, page: p, limit: lim });
}));

// Approve/Reject KYC for user (seller)
router.post('/users/:id/kyc', auth(['admin', 'superadmin']), requireAdmin, [body('status').isIn(['approved','rejected','pending'])], asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { kycStatus: req.body.status }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

// Verify/Unverify shop and ban/unban
router.post('/shops/:id/verify', auth(['admin', 'superadmin']), requireAdmin, [body('verified').isBoolean()], asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { isVerified: !!req.body.verified }, { new: true });
  if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
  res.json({ success: true, shop });
}));

// Approve alias (frontend compatibility)
router.post('/shops/:id/approve', auth(['admin', 'superadmin']), requireAdmin, [body('approve').isBoolean()], asyncHandler(async (req, res) => {
  const shop = await Shop.findByIdAndUpdate(req.params.id, { isVerified: !!req.body.approve }, { new: true });
  if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
  res.json({ success: true, shop });
}));

router.post('/shops/:id/ban', auth(['admin', 'superadmin']), requireAdmin, [body('ban').isBoolean()], asyncHandler(async (req, res) => {
  const ban = !!req.body.ban;
  const update = ban ? { status: 'suspended' } : { status: 'active' };
  const shop = await Shop.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
  res.json({ success: true, shop });
}));

// List shops (search, filters, pagination)
router.get('/shops', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q = '', status, from, to } = req.query || {};
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(parseInt(limit, 10) || 20, 100);
  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
    ];
  }
  if (status === 'approved') filter.isVerified = true;
  if (status === 'pending') filter.isVerified = { $ne: true };
  if (status === 'banned') filter.status = 'suspended';
  if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };

  const query = Shop.find(filter)
    .sort({ createdAt: -1 })
    .skip((p - 1) * lim)
    .limit(lim)
    .select('name slug owner isVerified status createdAt');

  // populate owner basic profile
  query.populate({ path: 'owner', select: 'username email profile.fullName' });

  const [items, total] = await Promise.all([
    query.lean(),
    Shop.countDocuments(filter),
  ]);

  // Map to frontend expected shape
  const shops = items.map((s) => ({
    _id: String(s._id),
    name: s.name,
    slug: s.slug,
    approved: !!s.isVerified,
    owner: s.owner ? {
      id: String(s.owner._id || s.owner),
      name: s.owner?.profile?.fullName || s.owner?.username || s.owner?.email || 'Owner',
      email: s.owner?.email,
    } : undefined,
    ordersCount: undefined, // optional: can be aggregated later
    status: (s.status === 'suspended') ? 'banned' : (s.isVerified ? 'approved' : 'pending'),
    createdAt: s.createdAt,
  }));

  res.json({ success: true, shops, total, page: p, limit: lim });
}));

// Web3 admin: holders list and stats
router.get('/web3/holders', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  if (!WalletAddress) return res.status(404).json({ success: false, message: 'WalletAddress model not available' });
  const { page = 1, limit = 20, q = '', token } = req.query || {};
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(parseInt(limit, 10) || 20, 100);
  const regex = q ? new RegExp(String(q), 'i') : null;
  const tokenType = token ? String(token).toLowerCase() : undefined; // e.g., 'ind' or 'evm'

  const matchBase = { ...(tokenType ? { type: tokenType } : {}) };
  const pipeline = [
    { $match: matchBase },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ];
  if (regex) {
    pipeline.push({ $match: { $or: [
      { address: regex },
      { 'user.username': regex },
      { 'user.email': regex },
      { 'user.profile.fullName': regex },
    ] } });
  }
  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $facet: {
    items: [ { $skip: (p - 1) * lim }, { $limit: lim } ],
    total: [ { $count: 'count' } ]
  } });

  const result = await WalletAddress.aggregate(pipeline);
  const items = (result[0]?.items || []).map((w) => ({
    userId: String(w.user?._id || ''),
    name: w.user?.profile?.fullName || w.user?.username || w.user?.email || 'User',
    email: w.user?.email,
    wallet: w.address,
    token: token || (w.type || '').toUpperCase(),
    balance: null,
  }));
  const total = Number(result[0]?.total?.[0]?.count || 0);
  res.json({ success: true, holders: items, total, page: p, limit: lim });
}));

router.get('/web3/stats', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  if (!WalletAddress) return res.status(404).json({ success: false, message: 'WalletAddress model not available' });
  const [indCount, evmCount, userCount] = await Promise.all([
    WalletAddress.countDocuments({ type: 'ind' }),
    WalletAddress.countDocuments({ type: 'evm' }),
    User.countDocuments({})
  ]);
  res.json({ success: true, stats: { holdersIND: indCount, holdersEVM: evmCount, users: userCount } });
}));

// Approve payout manually (simulate transfer)
router.post('/payouts/:id/approve', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const payout = await Payout.findByIdAndUpdate(req.params.id, { status: 'paid', paidAt: new Date() }, { new: true });
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  res.json({ success: true, payout });
}));

// List payouts (admin)
router.get('/payouts', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.min(parseInt(limit, 10) || 50, 100);
  const [items, total] = await Promise.all([
    Payout.find({}).sort({ createdAt: -1 }).skip((p - 1) * lim).limit(lim).lean(),
    Payout.countDocuments({}),
  ]);
  res.json({ success: true, payouts: items, total, page: p, limit: lim });
}));

// Notify a user (store notification; email/SMS integration can be added via a service)
router.post('/users/:id/notify', auth(['admin', 'superadmin']), requireAdmin, [
  body('channel').isIn(['email', 'sms']).withMessage('channel must be email or sms'),
  body('message').isString().isLength({ min: 1 }).withMessage('message required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const n = await Notification.create({ user: user._id, title: 'Admin Message', body: req.body.message, meta: { channel: req.body.channel } });
  res.json({ success: true, notification: n });
}));

// List premium members (basic: read subscriptions and map to users)
router.get('/premium-members', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const subs = await Subscription.find({}).sort({ createdAt: -1 }).limit(200).lean();
  const userIds = [...new Set(subs.map(s => String(s.user || s.userId)).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).select('username email profile.fullName').lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));
  const members = subs.map(s => ({
    id: String(s._id),
    userId: String(s.user || s.userId),
    name: userMap.get(String(s.user || s.userId))?.profile?.fullName || userMap.get(String(s.user || s.userId))?.username || 'User',
    email: userMap.get(String(s.user || s.userId))?.email,
    tier: s.tier || s.plan || 'silver',
    renewal: s.renewal || s.expiresAt || s.renewAt || null,
    status: (s.expiresAt && new Date(s.expiresAt) < new Date()) ? 'expired' : 'active',
  }));
  res.json({ success: true, members });
}));

// Wallet Management Routes
// Manage seller wallet (add/deduct money)
router.post('/wallet', auth(['admin', 'superadmin']), requireAdmin, [
  body('sellerId').isString().withMessage('sellerId is required'),
  body('type').isIn(['add', 'deduct']).withMessage('type must be add or deduct'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be a positive number'),
  body('reason').isString().isLength({ min: 1 }).withMessage('reason is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { sellerId, type, amount, reason } = req.body;
  console.log(`[WALLET API] Received request:`, { sellerId, type, amount, reason });
  console.log(`[WALLET API] sellerId type:`, typeof sellerId, 'length:', sellerId?.length);
  console.log(`[WALLET API] ${type} $${amount} ${type === 'add' ? 'to' : 'from'} seller ${sellerId}. Reason: ${reason}`);

  try {
    // Validate sellerId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      console.log(`[WALLET API] Invalid sellerId format: ${sellerId}`);
      return res.status(400).json({ success: false, message: 'Invalid seller ID format' });
    }

    // Find the seller/user
    const seller = await User.findById(sellerId);
    console.log(`[WALLET API] User lookup result:`, seller ? 'found' : 'not found');
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Calculate new balance
    const currentBalance = seller.walletBalance || 0;
    const numAmount = parseFloat(amount);
    const newBalance = type === 'add' ? currentBalance + numAmount : currentBalance - numAmount;

    // Prevent negative balance for deduct operations
    if (type === 'deduct' && newBalance < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Update seller's wallet balance
    const updatedSeller = await User.findByIdAndUpdate(
      sellerId,
      { walletBalance: newBalance },
      { new: true }
    ).select('-passwordHash');

    // Create a transaction record (you might want to create a WalletTransaction model)
    // For now, we'll create a notification as audit trail
    await Notification.create({
      user: sellerId,
      title: 'Wallet Update',
      body: `Admin ${type === 'add' ? 'added' : 'deducted'} $${numAmount} ${type === 'add' ? 'to' : 'from'} your wallet. Reason: ${reason}`,
      meta: {
        type: 'wallet_transaction',
        adminId: req.user.id,
        transactionType: type,
        amount: numAmount,
        reason: reason,
        previousBalance: currentBalance,
        newBalance: newBalance
      }
    });

    res.json({
      success: true,
      message: `Successfully ${type === 'add' ? 'added' : 'deducted'} $${numAmount} ${type === 'add' ? 'to' : 'from'} seller wallet`,
      data: {
        sellerId,
        type,
        amount: numAmount,
        reason,
        previousBalance: currentBalance,
        newBalance: newBalance,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[WALLET API] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

// Get seller wallet details
router.get('/wallet', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const { sellerId } = req.query;

  if (!sellerId) {
    return res.status(400).json({ success: false, message: 'sellerId parameter required' });
  }

  try {
    const seller = await User.findById(sellerId).select('walletBalance email username profile');
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Get recent wallet transactions from notifications
    const transactions = await Notification.find({
      user: sellerId,
      'meta.type': 'wallet_transaction'
    }).sort({ createdAt: -1 }).limit(10).lean();

    const formattedTransactions = transactions.map(t => ({
      id: String(t._id),
      type: t.meta?.transactionType || 'unknown',
      amount: t.meta?.amount || 0,
      reason: t.meta?.reason || '',
      timestamp: t.createdAt,
      adminId: t.meta?.adminId
    }));

    res.json({
      success: true,
      data: {
        sellerId,
        balance: seller.walletBalance || 0,
        currency: 'USD',
        transactions: formattedTransactions
      }
    });

  } catch (error) {
    console.error('[WALLET API] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

// Plan Management Routes
// Set seller plan limits
router.post('/plan', auth(['admin', 'superadmin']), requireAdmin, [
  body('sellerId').isString().withMessage('sellerId is required'),
  body('type').isString().withMessage('type is required'),
  body('limit').isInt({ min: 0 }).withMessage('limit must be a non-negative integer'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { sellerId, type, limit } = req.body;
  console.log(`[PLAN API] Set ${type} to ${limit} for seller ${sellerId}`);

  try {
    // Find the seller/user
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Update seller's plan limits (store in profile metadata)
    const currentProfile = seller.profile || {};
    const currentPlanLimits = currentProfile.planLimits || {};
    
    currentPlanLimits[type] = parseInt(limit);
    currentProfile.planLimits = currentPlanLimits;

    const updatedSeller = await User.findByIdAndUpdate(
      sellerId,
      { profile: currentProfile },
      { new: true }
    ).select('-passwordHash');

    // Create audit trail notification
    await Notification.create({
      user: sellerId,
      title: 'Plan Limit Updated',
      body: `Admin set your ${type} limit to ${limit}`,
      meta: {
        type: 'plan_update',
        adminId: req.user.id,
        limitType: type,
        limitValue: limit
      }
    });

    res.json({
      success: true,
      message: `Successfully set plan limit to ${limit} for seller`,
      data: {
        sellerId,
        type,
        limit: parseInt(limit),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[PLAN API] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

// Get seller plan details
router.get('/plan', auth(['admin', 'superadmin']), requireAdmin, asyncHandler(async (req, res) => {
  const { sellerId } = req.query;

  if (!sellerId) {
    return res.status(400).json({ success: false, message: 'sellerId parameter required' });
  }

  try {
    const seller = await User.findById(sellerId).select('profile email username');
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const planLimits = seller.profile?.planLimits || {};
    
    // Get current usage (you might want to calculate this from actual data)
    // For now, we'll return mock usage data
    const currentUsage = {
      orders: 0, // You could calculate from Order model
      products: 0, // You could calculate from Product model
      monthly_revenue: 0 // You could calculate from recent orders
    };

    res.json({
      success: true,
      data: {
        sellerId,
        limits: {
          order_limit: planLimits.order_limit || 100,
          product_limit: planLimits.product_limit || 50,
          monthly_revenue_limit: planLimits.monthly_revenue_limit || 10000,
          ...planLimits
        },
        currentUsage,
        planType: planLimits.planType || 'standard'
      }
    });

  } catch (error) {
    console.error('[PLAN API] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}));

module.exports = router;
