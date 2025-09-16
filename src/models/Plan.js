const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema(
  {
    name: String,
    key: String,
    priceMonthly: Number,
    features: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', PlanSchema);
