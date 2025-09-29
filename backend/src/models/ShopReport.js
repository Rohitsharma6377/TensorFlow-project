const mongoose = require('mongoose');

const ShopReportSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', index: true, required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    reason: { type: String, required: true },
    details: { type: String },
    status: { type: String, enum: ['open', 'reviewing', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopReport', ShopReportSchema);
