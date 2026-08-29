import { ethers, network } from "hardhat";
import { ZeroGStorageClient } from "../packages/zero-g-storage/src";
import { AgentCreditScoringEngine } from "../packages/credit-scoring/src";

async function main() {
  const isMainnet = network.name === "zeroGMainnet";
  const chainName = isMainnet ? "0G Aristotle Mainnet (16661)" : "0G Galileo Testnet (16602)";
  const explorerBase = isMainnet ? "https://chainscan.0g.ai" : "https://chainscan-galileo.0g.ai";

  console.log("==================================================================");
  console.log(`Seeding Live On-Chain State on ${chainName}`);
  console.log("==================================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Operator Account: ${deployer.address}`);

  const storage = new ZeroGStorageClient(
    isMainnet ? "https://indexer-storage-turbo.0g.ai" : "https://indexer-storage-testnet-turbo.0g.ai"
  );
  const scoringEngine = new AgentCreditScoringEngine("https://router-api.0g.ai");

  // Deployed Contract Addresses
  const REGISTRY_ADDRESS = isMainnet 
    ? "0x0ba18878D80D7D901EbC0165f76dBe77f96B0F03" 
    : "0xaBF81109dd950cdDA067486D59562aEa128b37d2";

  const MARKET_ADDRESS = isMainnet 
    ? "0x73aE0dC431C9c3E05dcAFCC7831B43d2643668c8" 
    : "0xaC588096bd844c9c823dAb0628c6a30b8C240D62";

  console.log(`Connecting to AgentCreditRegistry: ${REGISTRY_ADDRESS}`);
  const registry = await ethers.getContractAt("AgentCreditRegistry", REGISTRY_ADDRESS, deployer);

  console.log(`Connecting to AgentBondMarket: ${MARKET_ADDRESS}`);
  const market = await ethers.getContractAt("AgentBondMarket", MARKET_ADDRESS, deployer);

  // 1. Run 0G Compute Assessment for ArbitrageAgent-Prime
  console.log("\n[Step 1: 0G Compute Assessment for ArbitrageAgent-Prime]");
  const assessment = scoringEngine.assessAgent(deployer.address, "ArbitrageAgent-Prime", {
    liquidBalanceEth: 12.5,
    monthlyRevenueEth: 6.0,
    taskCompletionRate: 99.6,
    walletAgeDays: 320,
    totalDebtIssuedEth: 2.0,
    totalDebtRepaidEth: 2.0,
    pastDefaultsCount: 0,
  });
  console.log(`  - Score: ${assessment.creditScore} (${assessment.grade})`);
  console.log(`  - 0G Compute Signature: ${assessment.computeSignatureRoot}`);

  // 2. Archive Report on 0G Storage Turbo
  console.log("\n[Step 2: Archiving on 0G Storage Turbo]");
  const reportReceipt = await storage.archiveCreditReport(assessment);
  console.log(`  - 0G Storage Merkle Root: ${reportReceipt.rootHash}`);

  // 3. Propose & Confirm Credit Proof on 0G Chain
  console.log(`\n[Step 3: Two-Phase Confirmable Proof on ${chainName}]`);
  
  const proposeTx = await registry.proposeCreditProof(
    deployer.address,
    assessment.agentName,
    assessment.creditScore,
    assessment.grade,
    reportReceipt.rootHash,
    assessment.computeSignatureRoot
  );
  const proposeReceipt = await proposeTx.wait();
  console.log(`  - Proof Proposed on-chain. Tx: ${proposeReceipt?.hash}`);

  const proofId = await registry.latestProofByAgent(deployer.address);
  const confirmTx = await registry.confirmCreditProof(proofId);
  const confirmReceipt = await confirmTx.wait();
  console.log(`  - Proof Confirmed on-chain. Tx: ${confirmReceipt?.hash}`);

  // 4. Issue Micro-Bond Series #1 on 0G Chain
  console.log(`\n[Step 4: Issuing 0G-BOND-2026A on ${chainName}]`);
  const prospectusRoot = storage.computeMerkleRoot({ series: "0G-BOND-2026A", purpose: "AI GPU Compute Financing on Mainnet" });
  const principalGoal = ethers.parseEther("0.1"); // 0.1 0G micro-bond
  const couponBps = 500; // 5.00%
  const durationSeconds = 86400 * 30; // 30 days

  const issueTx = await market.issueBond(principalGoal, couponBps, durationSeconds, prospectusRoot);
  const issueReceipt = await issueTx.wait();
  console.log(`  - Bond #1 Issued on 0G Chain. Tx: ${issueReceipt?.hash}`);

  console.log("\n==================================================================");
  console.log(`0G Seeding Succeeded on ${chainName}!`);
  console.log(`View on 0G Explorer: ${explorerBase}/address/${MARKET_ADDRESS}`);
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("Live Seeding Error:", err);
  process.exit(1);
});
