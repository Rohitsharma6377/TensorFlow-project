const mongoose = require('mongoose');

const DomainMapSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
    verificationToken: { type: String, required: true },
  },
  { timestamps: true }
);

DomainMapSchema.index({ domain: 1 }, { unique: true });

module.exports = mongoose.model('DomainMap', DomainMapSchema);
