const mongoose = require('mongoose');

const ShipmentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    trackingNumber: { type: String, index: true },
    status: { type: String, default: 'created' },
    eta: Date,
    deliveryCost: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', ShipmentSchema);
