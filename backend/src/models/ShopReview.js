const mongoose = require('mongoose');

const ShopReviewSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

ShopReviewSchema.index({ shop: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ShopReview', ShopReviewSchema);
