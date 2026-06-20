const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying on Amoy from:", deployer.address);

  // Relayer wallet = deployer for now; swap to a dedicated address when you
  // have a separate relayer key.
  const RELAYER_ADDRESS = deployer.address;

  const Mint = await ethers.getContractFactory("MintContract");
  const mint = await Mint.deploy(RELAYER_ADDRESS);
  await mint.waitForDeployment();
  const mintAddress = await mint.getAddress();
  console.log("MintContract (wTST) deployed to:", mintAddress);
  console.log("Relayer address set to:         ", RELAYER_ADDRESS);

  console.log("\n--- Add these to your .env ---");
  console.log(`MINT_CONTRACT_ADDRESS=${mintAddress}`);
  console.log(`RELAYER_ADDRESS=${RELAYER_ADDRESS}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
