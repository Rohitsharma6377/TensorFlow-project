const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional link
    caption: String,
    media: [String],
    type: { type: String, enum: ['product', 'lifestyle'], default: 'product' },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PostSchema.index({ caption: 'text' });

module.exports = mongoose.model('Post', PostSchema);
