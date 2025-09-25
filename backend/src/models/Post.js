const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional link
    caption: String,
    media: [String],
    audio: String, // optional audio track URL
    hashtags: [String], // optional hashtags like ['#sale', '#new']
    type: { type: String, enum: ['product', 'lifestyle'], default: 'product' },
    // status of the post for seller management
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PostSchema.index({ caption: 'text' });
PostSchema.index({ shop: 1, createdAt: -1 });
PostSchema.index({ shop: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
