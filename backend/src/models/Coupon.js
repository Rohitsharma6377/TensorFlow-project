const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    code: { type: String, required: true, trim: true },
    type: { type: String, enum: ['percent','fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    expiry: { type: Date },
    usageLimit: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ shop: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', CouponSchema);
