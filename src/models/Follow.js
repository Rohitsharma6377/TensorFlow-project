const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  },
  { timestamps: true }
);
FollowSchema.index({ follower: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model('Follow', FollowSchema);
