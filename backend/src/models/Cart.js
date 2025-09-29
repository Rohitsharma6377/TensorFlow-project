const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: String },
    title: { type: String },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, default: 1 },
    image: { type: String },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  },
  { _id: true, timestamps: true }
);

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true },
    items: [CartItemSchema],
    coupon: { type: String },
  },
  { timestamps: true }
);

CartSchema.methods.totals = function () {
  const subtotal = (this.items || []).reduce((sum, it) => sum + (it.price || 0) * (it.qty || 0), 0);
  return { subtotal, discount: 0, total: subtotal };
};

module.exports = mongoose.model('Cart', CartSchema);
