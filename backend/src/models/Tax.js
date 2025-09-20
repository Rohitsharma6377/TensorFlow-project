const mongoose = require('mongoose');

const TaxSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    percent: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TaxSchema.index({ shop: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tax', TaxSchema);
