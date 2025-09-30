const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    media: String,
    cta: String,
    // Optional product to showcase on the story
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
    expiresAt: Date,
    // Likes support
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    // Views tracking
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', StorySchema);
