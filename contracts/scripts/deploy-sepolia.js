const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying on Sepolia from:", deployer.address);

  // 1. Deploy TST token
  const TST = await ethers.getContractFactory("TestERC20");
  const tst = await TST.deploy();
  await tst.waitForDeployment();
  const tstAddress = await tst.getAddress();
  console.log("TestERC20 (TST) deployed to:", tstAddress);

  // 2. Deploy LockContract with TST address and 5-minute timeout
  const TIMEOUT = 5 * 60; // seconds
  const Lock = await ethers.getContractFactory("LockContract");
  const lock = await Lock.deploy(tstAddress, TIMEOUT);
  await lock.waitForDeployment();
  const lockAddress = await lock.getAddress();
  console.log("LockContract deployed to:  ", lockAddress);

  console.log("\n--- Add these to your .env ---");
  console.log(`TST_ADDRESS=${tstAddress}`);
  console.log(`LOCK_CONTRACT_ADDRESS=${lockAddress}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
