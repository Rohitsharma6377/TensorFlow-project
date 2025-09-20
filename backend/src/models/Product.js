const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema(
  {
    sku: { type: String, index: true },
    attributes: { type: Object }, // e.g., { color: 'Red', size: 'M' }
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    stock: { type: Number, default: 0 },
    images: [String],
    mainImage: String,
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    title: { type: String, required: true },
    sku: { type: String, index: true }, // primary/default SKU
    description: String,
    price: { type: Number, required: true, min: 0 }, // default/lowest price across variants
    mrp: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' },
    taxRate: { type: Number, default: 0 },
    stock: { type: Number, default: 0 }, // total across variants
    images: [String], // default gallery
    mainImage: String,
    // Backward-compatible text fields
    brand: String,
    category: String,
    tags: [String],
    // New relational refs
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    discount: {
      type: {
        type: String,
        enum: ['percent', 'fixed'],
      },
      value: { type: Number, min: 0 },
      expiry: { type: Date },
      usageLimit: { type: Number, min: 0 },
    },
    attributes: { type: Object }, // generic attributes/specs
    options: { type: Object }, // e.g., { color: ['Red','Blue'], size:['S','M'] }
    variants: [VariantSchema],
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

ProductSchema.index({ title: 'text', description: 'text' });
ProductSchema.index({ category: 1 });

module.exports = mongoose.model('Product', ProductSchema);
