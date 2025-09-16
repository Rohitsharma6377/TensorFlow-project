const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Escrow = require('../models/Escrow');
const auth = require('../middleware/auth');

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
