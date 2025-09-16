const mongoose = require('mongoose');

const CODRemittanceSchema = new mongoose.Schema(
  {
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', index: true },
    remittanceDate: { type: Date, required: true },
    shipments: [{ trackingNumber: String, amount: Number }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['received','reconciled','failed'], default: 'received' },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('CODRemittance', CODRemittanceSchema);
