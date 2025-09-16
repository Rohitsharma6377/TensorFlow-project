const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    media: String,
    cta: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', StorySchema);
