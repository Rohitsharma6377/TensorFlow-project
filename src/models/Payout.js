const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amount: { type: Number, required: true },
    commission: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'processing', 'paid', 'failed'], default: 'pending' },
    scheduledAt: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', PayoutSchema);
