const mongoose = require('mongoose');

const DeliveryPartnerSchema = new mongoose.Schema(
  {
    name: String,
    apiKey: String,
    settings: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryPartner', DeliveryPartnerSchema);
