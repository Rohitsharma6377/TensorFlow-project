const mongoose = require('mongoose');

const WalletAddressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    address: { type: String, index: true, required: true },
    publicKey: { type: String },
    type: { type: String, enum: ['ind', 'evm'], default: 'ind', index: true },
    label: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

WalletAddressSchema.index({ user: 1, address: 1 }, { unique: true });

module.exports = mongoose.model('WalletAddress', WalletAddressSchema);
