const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../utils/async');
const { createPaymentIntent, verifyWebhookSignature } = require('../utils/payments');
const Order = require('../models/Order');
const Escrow = require('../models/Escrow');
const auth = require('../middleware/auth');

const router = express.Router();

// Optional SDK clients (loaded only if keys provided)
let razorpay = null;
let stripe = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  const Razorpay = require('razorpay');
  razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Create payment intent/order (client calls before redirecting to gateway)
router.post(
  '/intent',
  auth(),
  [body('amount').isFloat({ gt: 0 }), body('currency').optional().isString(), body('orderId').optional().isString()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { amount, currency = 'INR', orderId, gateway } = req.body;
    // Prefer real SDKs when configured
    if (gateway === 'razorpay' && razorpay) {
      const options = { amount: Math.round(amount * 100), currency, notes: { userId: req.user.id, orderId } };
      const order = await razorpay.orders.create(options);
      return res.json({ success: true, intent: { provider: 'razorpay', order } });
    }
    if (gateway === 'stripe' && stripe) {
      const pi = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency, metadata: { userId: req.user.id, orderId } });
      return res.json({ success: true, intent: { provider: 'stripe', clientSecret: pi.client_secret } });
    }
    // Fallback stub
    const intent = await createPaymentIntent({ gateway, amount, currency, metadata: { userId: req.user.id, orderId } });
    return res.json({ success: true, intent });
  })
);

// Razorpay webhook
router.post('/razorpay/webhook', asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) return res.status(400).json({ success: false, message: 'Missing signature/secret' });
  // req.body is Buffer because of express.raw registered in index.js
  const rawBody = req.body;
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected !== signature) return res.status(400).json({ success: false, message: 'Invalid signature' });
  const payload = JSON.parse(rawBody.toString('utf8'));
  const orderId = payload?.payload?.payment?.entity?.notes?.orderId || payload?.payload?.order?.entity?.notes?.orderId || payload.orderId;
  if (!orderId) return res.status(400).json({ success: false, message: 'Missing orderId' });
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  order.paymentStatus = 'paid';
  order.status = 'paid';
  await order.save();
  await Escrow.findOneAndUpdate({ order: order._id }, {}, { upsert: true });
  res.json({ success: true });
}));

// Stripe webhook requires raw body to verify signature
const stripeWebhookRouter = express.Router({});
stripeWebhookRouter.use('/stripe/webhook', express.raw({ type: 'application/json' }));
stripeWebhookRouter.post('/stripe/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    if (!stripe) return res.status(501).json({ success: false, message: 'Stripe not configured' });
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = 'paid';
          order.status = 'paid';
          await order.save();
          await Escrow.findOneAndUpdate({ order: order._id }, {}, { upsert: true });
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error', err);
    res.status(500).json({ success: false });
  }
});

router.use(stripeWebhookRouter);

module.exports = router;
