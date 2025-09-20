const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    logo: { type: String }, // URL
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BrandSchema.index({ shop: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Brand', BrandSchema);
