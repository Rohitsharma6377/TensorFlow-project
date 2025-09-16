const BaseDeliveryAdapter = require('./baseAdapter');

class DelhiveryAdapter extends BaseDeliveryAdapter {
  async createShipment(order, shop, shipmentPayload) {
    // TODO: call Delhivery API
    return {
      trackingNumber: `DLV-${Date.now()}`,
      eta: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      raw: { provider: 'delhivery' },
    };
  }
  async cancelShipment(trackingNumber) {
    return { success: true };
  }
  async getTracking(trackingNumber) {
    return { trackingNumber, status: 'in_transit', eta: new Date(Date.now() + 2 * 24 * 3600 * 1000) };
  }
}

module.exports = DelhiveryAdapter;
