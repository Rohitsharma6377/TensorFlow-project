const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  },
  { timestamps: true }
);
LikeSchema.index({ user: 1, product: 1 }, { unique: true, partialFilterExpression: { product: { $type: 'objectId' } } });
LikeSchema.index({ user: 1, post: 1 }, { unique: true, partialFilterExpression: { post: { $type: 'objectId' } } });

module.exports = mongoose.model('Like', LikeSchema);
