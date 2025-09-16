const BaseDeliveryAdapter = require('./baseAdapter');

class ShiprocketAdapter extends BaseDeliveryAdapter {
  async createShipment(order, shop, shipmentPayload) {
    return {
      trackingNumber: `SR-${Date.now()}`,
      eta: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      raw: { provider: 'shiprocket' },
    };
  }
  async cancelShipment(trackingNumber) { return { success: true }; }
  async getTracking(trackingNumber) { return { trackingNumber, status: 'in_transit' }; }
}

module.exports = ShiprocketAdapter;
