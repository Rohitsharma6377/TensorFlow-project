const express = require('express');
const Payout = require('../models/Payout');
const Escrow = require('../models/Escrow');
const Shop = require('../models/Shop');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/async');

const router = express.Router();

// List payouts for current seller
router.get('/me', auth(['seller', 'admin', 'superadmin']), asyncHandler(async (req, res) => {
  const payouts = await Payout.find({ seller: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, payouts });
}));

// Admin: process payouts for released escrows
// POST /api/v1/payouts/process { commissionPct?: number, deliveryChargePerOrder?: number }
router.post('/process', auth(['admin', 'superadmin']), asyncHandler(async (req, res) => {
  const commissionPct = Number(req.body.commissionPct ?? 0.05); // default 5%
  const deliveryChargePerOrder = Number(req.body.deliveryChargePerOrder ?? 0);

  // Find released escrows that have not been paid out yet.
  const escrows = await Escrow.find({ status: 'released' }).limit(100);
  const created = [];

  for (const e of escrows) {
    for (const alloc of e.allocations || []) {
      const shop = await Shop.findById(alloc.shop);
      if (!shop) continue;
      const seller = await User.findById(shop.ownerId);
      if (!seller) continue;

      const commission = alloc.amount * commissionPct;
      const net = Math.max(0, alloc.amount - commission - deliveryChargePerOrder);

      // Idempotency naive check: do not double-create for same order+shop
      const exists = await Payout.findOne({ order: e.order, shop: shop._id });
      if (exists) continue;

      const payout = await Payout.create({
        seller: seller._id,
        shop: shop._id,
        order: e.order,
        amount: net,
        commission,
        deliveryCharges: deliveryChargePerOrder,
        status: 'pending',
        scheduledAt: new Date(),
      });
      created.push(payout);
    }
  }

  res.json({ success: true, created: created.length, payouts: created });
}));

module.exports = router;
