const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, enum: ['product', 'shop', 'comment', 'order'] },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    reason: String,
    evidence: [String],
    status: { type: String, enum: ['open', 'in_review', 'resolved', 'rejected'], default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
