const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'packed', 'shipped', 'delivered', 'returned', 'cancelled'], default: 'pending' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    shippingAddress: { type: Object },
    paymentMethod: String,
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    status: { type: String, enum: ['created', 'paid', 'partially_shipped', 'completed', 'disputed', 'cancelled'], default: 'created' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
