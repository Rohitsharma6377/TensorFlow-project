const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    amount: Number,
  },
  { _id: false }
);

const EscrowSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    totalAmount: { type: Number, required: true },
    allocations: [AllocationSchema],
    status: { type: String, enum: ['held', 'released', 'refunded'], default: 'held' },
    releaseDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Escrow', EscrowSchema);
