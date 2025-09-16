const mongoose = require('mongoose');

const PickupSchema = new mongoose.Schema(
  {
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', index: true },
    shipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
    status: { type: String, enum: ['pending','accepted','in_progress','completed','cancelled'], default: 'pending' },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pickup', PickupSchema);
