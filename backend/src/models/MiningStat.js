const mongoose = require('mongoose');

const MiningStatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    count: { type: Number, default: 0 },
    pausedUntil: { type: Date, default: null }, // cooldown after each 25 mines
  },
  { timestamps: true }
);

MiningStatSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MiningStat', MiningStatSchema);
