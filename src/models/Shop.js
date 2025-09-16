const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shopName: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    bio: String,
    logoUrl: String,
    location: String,
    categories: [String],
    planType: { type: String, enum: ['basic', 'silver', 'gold', null], default: null },
    verified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ShopSchema.index({ slug: 1 });

module.exports = mongoose.model('Shop', ShopSchema);
