const BaseDeliveryAdapter = require('./baseAdapter');

class DunzoAdapter extends BaseDeliveryAdapter {
  async createShipment(order, shop, shipmentPayload) {
    return {
      trackingNumber: `DNZ-${Date.now()}`,
      eta: new Date(Date.now() + 6 * 3600 * 1000),
      raw: { provider: 'dunzo' },
    };
  }
  async cancelShipment(trackingNumber) { return { success: true }; }
  async getTracking(trackingNumber) { return { trackingNumber, status: 'out_for_delivery' }; }
}

module.exports = DunzoAdapter;
