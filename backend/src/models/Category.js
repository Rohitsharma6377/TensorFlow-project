const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ shop: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', CategorySchema);
