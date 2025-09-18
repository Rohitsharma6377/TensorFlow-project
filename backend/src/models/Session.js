const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    sid: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // For guest sessions where no user exists yet
    payload: { type: Object },
    expiresAt: { type: Date, required: true, index: true },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', SessionSchema);
