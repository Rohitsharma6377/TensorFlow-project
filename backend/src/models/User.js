const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'seller', 'admin', 'superadmin', 'delivery'], default: 'customer' },
    profilePic: { type: String },
    profile: {
      fullName: String,
      avatarUrl: String,
      bio: String,
      location: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' },
      },
    },
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    planType: { type: String, enum: ['basic', 'silver', 'gold', null], default: null },
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    // Web3 wallet fields
    walletAddress: { type: String, index: true },
    walletPublicKey: { type: String },
    addresses: [
      {
        id: { type: String },
        label: String,
        name: String,
        phone: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        coords: { lat: Number, lng: Number },
      },
    ],
    // Auth tokens (for auditing/debug) - Do not use for auth validation
    lastToken: { type: String },
    tokenHistory: [{ token: String, issuedAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);

