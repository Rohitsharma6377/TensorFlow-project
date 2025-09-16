class BaseDeliveryAdapter {
  constructor(config = {}) {
    this.config = config;
  }
  async createShipment(order, shop, shipmentPayload) {
    throw new Error('Not implemented');
  }
  async cancelShipment(trackingNumber) {
    throw new Error('Not implemented');
  }
  async getTracking(trackingNumber) {
    throw new Error('Not implemented');
  }
  async webhookHandler(payload) {
    // returns normalized event { trackingNumber, status, eta }
    return payload;
  }
}

module.exports = BaseDeliveryAdapter;
