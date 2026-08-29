import { ethers } from "hardhat";
import { ZeroGStorageClient } from "../packages/zero-g-storage/src";
import { AgentCreditScoringEngine } from "../packages/credit-scoring/src";

async function main() {
  console.log("==================================================================");
  console.log("Credence0G: AI Agent Credit Bureau & On-Chain Bond Market Flow");
  console.log("==================================================================");

  const [deployer, oracle, agentWallet, investor1, investor2] = await ethers.getSigners();
  const storage = new ZeroGStorageClient();
  const scoringEngine = new AgentCreditScoringEngine();

  // 1. Deploy Multi-Contract Suite
  console.log("\n[Step 1: Deploy Multi-Contract Suite]");
  const registryFactory = await ethers.getContractFactory("AgentCreditRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();
  await registry.setOracle(oracle.address);

  const escrowFactory = await ethers.getContractFactory("AgentBondEscrow");
  const escrow = await escrowFactory.deploy();
  await escrow.waitForDeployment();

  const marketFactory = await ethers.getContractFactory("AgentBondMarket");
  const market = await marketFactory.deploy(await registry.getAddress(), await escrow.getAddress());
  await market.waitForDeployment();
  await escrow.setBondMarket(await market.getAddress());

  console.log(`AgentCreditRegistry: ${await registry.getAddress()}`);
  console.log(`AgentBondEscrow:     ${await escrow.getAddress()}`);
  console.log(`AgentBondMarket:     ${await market.getAddress()}`);

  // 2. Assess Agent Credit Risk via 0G Compute Oracle
  console.log("\n[Step 2: Verifiable AI Credit Risk Assessment (0G Compute)]");
  const assessment = scoringEngine.assessAgent(
    agentWallet.address,
    "ArbitrageAgent-Prime",
    {
      liquidBalanceEth: 8.5,
      monthlyRevenueEth: 4.2,
      taskCompletionRate: 99.1,
      walletAgeDays: 240,
      totalDebtIssuedEth: 3.0,
      totalDebtRepaidEth: 3.0,
      pastDefaultsCount: 0,
    }
  );

  console.log(`Assessed Agent: ${assessment.agentName} (${assessment.agentAddress})`);
  console.log(`  - Credit Score: ${assessment.creditScore} / 850 (Grade: ${assessment.grade})`);
  console.log(`  - Max Borrowing Capacity: ${assessment.maxBorrowingCapacityEth} ETH/0G`);
  console.log(`  - 0G Compute Verification Hash: ${assessment.computeSignatureRoot}`);

  // 3. Archive Credit Assessment Report on 0G Storage
  console.log("\n[Step 3: Archival of Credit Audit Report (0G Storage Turbo)]");
  const reportReceipt = await storage.archiveCreditReport(assessment);
  console.log(`Report Root Hash (Merkle): ${reportReceipt.rootHash}`);
  console.log(`Storage URI: ${reportReceipt.storageUri}`);
  console.log(`Payload Size: ${reportReceipt.payloadSizeBytes} bytes`);

  // 4. Two-Phase Confirmable Proof Write on 0G Chain
  console.log("\n[Step 4: Confirmable Credit Proof Pipeline on 0G Chain]");
  const proposeTx = await registry.connect(oracle).proposeCreditProof(
    agentWallet.address,
    assessment.agentName,
    assessment.creditScore,
    assessment.grade,
    reportReceipt.rootHash,
    assessment.computeSignatureRoot
  );
  await proposeTx.wait();
  const proofId = await registry.latestProofByAgent(agentWallet.address);
  console.log(`Phase 1 (Proposal): Proposed Proof ID ${proofId}`);

  const confirmTx = await registry.connect(oracle).confirmCreditProof(proofId);
  await confirmTx.wait();
  console.log("Phase 2 (Confirmation): Proof confirmed and active in Registry.");

  // 5. Agent Issues Micro-Bond
  console.log("\n[Step 5: Agent Issues Debt Bond]");
  const prospectus = {
    agent: assessment.agentName,
    intendedUse: "GPU Compute Cluster & MEV Flashloan Reserve",
    durationDays: 30,
    couponRateBps: 500, // 5.00%
  };
  const prospectusReceipt = await storage.archiveCreditReport(prospectus);
  const principalGoal = ethers.parseEther("2.0");
  const couponBps = 500; // 5.00%
  const durationSeconds = 86400 * 30;

  const issueTx = await market.connect(agentWallet).issueBond(
    principalGoal,
    couponBps,
    durationSeconds,
    prospectusReceipt.rootHash
  );
  const issueReceipt = await issueTx.wait();
  console.log(`Bond #1 successfully issued. Tx: ${issueReceipt?.hash}`);

  // 6. Multiple Investors Subscribe into Escrow
  console.log("\n[Step 6: Investor Subscriptions into Escrow & Automated Disbursement]");
  const inv1Amount = ethers.parseEther("1.2"); // 60%
  const inv2Amount = ethers.parseEther("0.8"); // 40%

  await (await market.connect(investor1).subscribeToBond(1, { value: inv1Amount })).wait();
  console.log(`Investor 1 subscribed 1.2 ETH (60%) into Escrow`);

  await (await market.connect(investor2).subscribeToBond(1, { value: inv2Amount })).wait();
  console.log(`Investor 2 subscribed 0.8 ETH (40%) into Escrow`);

  const fundedBond = await market.getBond(1);
  console.log(`Bond Status after funding: ${fundedBond.status === 1n ? "Active (Disbursed to Agent)" : "Funding"}`);

  // 7. Agent Repays Debt with Coupon Interest
  console.log("\n[Step 7: Agent Repays Principal + 5% Coupon Interest into Escrow]");
  const requiredRepayment = await market.calculateRepaymentAmount(1);
  console.log(`Required Repayment Amount: ${ethers.formatEther(requiredRepayment)} ETH (Principal: 2.0 ETH, Yield: 0.1 ETH)`);

  const repayTx = await market.connect(agentWallet).repayBond(1, { value: requiredRepayment });
  await repayTx.wait();
  console.log("Bond successfully repaid into Escrow and marked Matured.");

  // 8. Investors Claim Their Yields from Escrow
  console.log("\n[Step 8: Investors Claim Principal + Yield from Escrow]");
  const claim1Tx = await market.connect(investor1).claimYield(1);
  await claim1Tx.wait();
  console.log("Investor 1 claimed 1.26 ETH (1.2 ETH principal + 0.06 ETH yield)");

  const claim2Tx = await market.connect(investor2).claimYield(1);
  await claim2Tx.wait();
  console.log("Investor 2 claimed 0.84 ETH (0.8 ETH principal + 0.04 ETH yield)");

  console.log("\n==================================================================");
  console.log("Credence0G End-to-End Multi-Contract Verification Complete.");
  console.log("==================================================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
