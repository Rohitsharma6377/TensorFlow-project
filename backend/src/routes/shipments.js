const express = require('express');
const Shipment = require('../models/Shipment');
const Escrow = require('../models/Escrow');
const Order = require('../models/Order');
const { asyncHandler } = require('../utils/async');
const auth = require('../middleware/auth');
const DeliveryPartner = require('../models/DeliveryPartner');
const { getAdapter } = require('../services/delivery');

const router = express.Router();

// Create shipment (seller/admin)
router.post('/', auth(['seller', 'admin', 'superadmin']), asyncHandler(async (req, res) => {
  // expected req.body: { orderId, shop, partner, shipmentPayload }
  const { orderId, shop, partner, shipmentPayload } = req.body;
  let trackingNumber, eta;
  if (partner) {
    const dp = await DeliveryPartner.findById(partner);
    if (!dp) return res.status(400).json({ success: false, message: 'Invalid partner' });
    const adapter = getAdapter(dp?.settings?.provider, dp?.settings || {});
    const order = await Order.findById(orderId);
    const result = await adapter.createShipment(order, shop, shipmentPayload || {});
    trackingNumber = result.trackingNumber;
    eta = result.eta;
  }
  const s = await Shipment.create({ orderId, shop, partner, trackingNumber, status: 'created', eta, deliveryCost: req.body.deliveryCost });
  res.status(201).json({ success: true, shipment: s });
}));

// Delivery partner webhook
router.post('/webhook', asyncHandler(async (req, res) => {
  const { trackingNumber, status } = req.body;
  const s = await Shipment.findOneAndUpdate({ trackingNumber }, { status }, { new: true });
  if (s && status && status.toLowerCase() === 'delivered') {
    // Mark order item delivered
    await Order.findByIdAndUpdate(s.orderId, { $set: { 'items.$[it].status': 'delivered' } }, { arrayFilters: [{ 'it.shop': s.shop }] });
    // Release escrow for this order (full release for simplicity)
    await Escrow.findOneAndUpdate({ order: s.orderId }, { status: 'released', releaseDate: new Date() });
  }
  res.json({ success: true, shipment: s || null });
}));

module.exports = router;
