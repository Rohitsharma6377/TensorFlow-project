require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const { INFURA_KEY = '', PRIVATE_KEY = '' } = process.env;

module.exports = {
  solidity: '0.8.20',
  networks: {
    sepolia: {
      url: INFURA_KEY ? `https://sepolia.infura.io/v3/${INFURA_KEY}` : '',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
  },
};
