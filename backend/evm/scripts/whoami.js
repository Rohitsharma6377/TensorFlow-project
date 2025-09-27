require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  const addr = await deployer.getAddress();
  const bal = await ethers.provider.getBalance(addr);
  const net = await ethers.provider.getNetwork();
  console.log('[whoami] network:', net.name || net.chainId);
  console.log('[whoami] address:', addr);
  console.log('[whoami] balance (wei):', bal.toString());
  console.log('[whoami] balance (ETH):', Number(ethers.formatEther(bal)));
}

main().catch((e) => { console.error(e); process.exit(1); });
