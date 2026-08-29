import { ethers } from "hardhat";
import { ZeroGStorageClient } from "../packages/zero-g-storage/src";
import { AgentCreditScoringEngine, AgentMetrics } from "../packages/credit-scoring/src";

interface MonitoredAgent {
  name: string;
  address: string;
  metrics: AgentMetrics;
}

async function runOracleDaemon() {
  console.log("==================================================================");
  console.log("Starting Credence0G Autonomous Credit Oracle Daemon");
  console.log("Monitoring 0G Chain, 0G Storage & 0G Compute");
  console.log("==================================================================");

  const [oracleSigner] = await ethers.getSigners();
  const storage = new ZeroGStorageClient();
  const scoringEngine = new AgentCreditScoringEngine();

  // Deploy or connect to AgentBondMarket
  const factory = await ethers.getContractFactory("AgentBondMarket");
  const market = await factory.deploy();
  await market.waitForDeployment();
  console.log(`Connected to AgentBondMarket at: ${await market.getAddress()}`);

  const activeAgents: MonitoredAgent[] = [
    {
      name: "ArbitrageAgent-Prime",
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      metrics: {
        liquidBalanceEth: 10.5,
        monthlyRevenueEth: 5.4,
        taskCompletionRate: 99.4,
        walletAgeDays: 280,
        totalDebtIssuedEth: 4.0,
        totalDebtRepaidEth: 4.0,
        pastDefaultsCount: 0,
      }
    },
    {
      name: "DataSentinel-Crawler",
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      metrics: {
        liquidBalanceEth: 4.2,
        monthlyRevenueEth: 1.9,
        taskCompletionRate: 96.0,
        walletAgeDays: 140,
        totalDebtIssuedEth: 2.0,
        totalDebtRepaidEth: 2.0,
        pastDefaultsCount: 0,
      }
    },
    {
      name: "MEV-Liquidator-Alpha",
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      metrics: {
        liquidBalanceEth: 16.0,
        monthlyRevenueEth: 8.5,
        taskCompletionRate: 93.0,
        walletAgeDays: 75,
        totalDebtIssuedEth: 8.0,
        totalDebtRepaidEth: 8.0,
        pastDefaultsCount: 0,
      }
    }
  ];

  console.log(`\nFound ${activeAgents.length} active agents to evaluate...`);

  for (const agent of activeAgents) {
    console.log(`\nEvaluating [${agent.name}] (${agent.address})...`);
    
    // 1. Compute verifiable score on 0G Compute
    const assessment = scoringEngine.assessAgent(agent.address, agent.name, agent.metrics);
    console.log(`  -> Score: ${assessment.creditScore} (Grade: ${assessment.grade})`);
    console.log(`  -> Borrowing Limit: ${assessment.maxBorrowingCapacityEth} ETH/0G`);
    console.log(`  -> Default Prob: ${(assessment.defaultProbabilityBps / 100).toFixed(2)}%`);

    // 2. Archive to 0G Storage
    const receipt = await storage.archiveCreditReport(assessment);
    console.log(`  -> 0G Storage Merkle Root: ${receipt.rootHash}`);

    // 3. Submit rating to 0G Chain
    const tx = await market.registerOrUpdateCreditRating(
      agent.address,
      agent.name,
      assessment.creditScore,
      assessment.grade,
      receipt.rootHash
    );
    await tx.wait();
    console.log(`  -> Rating anchored on-chain. Tx: ${tx.hash}`);
  }

  console.log("\n==================================================================");
  console.log("Oracle Daemon Cycle Completed Successfully.");
  console.log("==================================================================");
}

runOracleDaemon().catch((err) => {
  console.error("Oracle Daemon Error:", err);
  process.exit(1);
});
