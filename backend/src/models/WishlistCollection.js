const mongoose = require('mongoose');

const WishlistCollectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    name: { type: String, required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

WishlistCollectionSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('WishlistCollection', WishlistCollectionSchema);
