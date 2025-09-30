const mongoose = require('mongoose');

// Supported notification types
// follow, unfollow, post_new, story_new, post_like, post_comment, story_like
const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // target recipient
    type: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    message: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
