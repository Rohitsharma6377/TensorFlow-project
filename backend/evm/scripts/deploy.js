require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  console.log('[IND EVM] Deploying INDToken...');
  const IND = await ethers.getContractFactory('INDToken');
  const ind = await IND.deploy();
  await ind.waitForDeployment();
  const addr = await ind.getAddress();
  console.log('[IND EVM] INDToken deployed at:', addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
