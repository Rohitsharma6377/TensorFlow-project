const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: Object }, // redacted fields only
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
