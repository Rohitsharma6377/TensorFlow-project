const DelhiveryAdapter = require('./delhivery');
const DunzoAdapter = require('./dunzo');
const ShiprocketAdapter = require('./shiprocket');

function getAdapter(provider, config = {}) {
  const key = (provider || 'shiprocket').toLowerCase();
  switch (key) {
    case 'delhivery':
      return new DelhiveryAdapter(config);
    case 'dunzo':
      return new DunzoAdapter(config);
    default:
      return new ShiprocketAdapter(config);
  }
}

module.exports = { getAdapter };
