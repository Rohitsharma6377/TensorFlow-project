const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TagSchema.index({ shop: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tag', TagSchema);
