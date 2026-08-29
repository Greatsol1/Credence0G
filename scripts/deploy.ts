import { ethers } from "hardhat";

async function main() {
  console.log("==================================================================");
  console.log("Deploying Credence0G Multi-Contract Suite to 0G Chain");
  console.log("==================================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from Account: ${deployer.address}`);

  // 1. Deploy AgentCreditRegistry
  const registryFactory = await ethers.getContractFactory("AgentCreditRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`AgentCreditRegistry deployed at: ${registryAddress}`);

  // 2. Deploy AgentBondEscrow
  const escrowFactory = await ethers.getContractFactory("AgentBondEscrow");
  const escrow = await escrowFactory.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`AgentBondEscrow deployed at: ${escrowAddress}`);

  // 3. Deploy AgentBondMarket
  const marketFactory = await ethers.getContractFactory("AgentBondMarket");
  const market = await marketFactory.deploy(registryAddress, escrowAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log(`AgentBondMarket deployed at: ${marketAddress}`);

  // 4. Authorize Market in Escrow
  const authTx = await escrow.setBondMarket(marketAddress);
  await authTx.wait();
  console.log("Escrow contract authorized Market calls.");

  console.log("\n==================================================================");
  console.log("Deployment Complete on 0G Network.");
  console.log(`0G Explorer: https://chainscan-galileo.0g.ai/address/${marketAddress}`);
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Deployment Error:", err);
  process.exit(1);
});
