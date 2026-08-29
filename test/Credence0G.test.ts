import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AgentCreditRegistry, AgentBondMarket, AgentBondEscrow } from "../typechain-types";

describe("Credence0G — Multi-Contract Suite & Confirmable 0G Proof Pipeline", function () {
  const mockReportRoot = ethers.keccak256(ethers.toUtf8Bytes("0G-STORAGE-REPORT-MERKLE-ROOT-1"));
  const mockComputeSig = ethers.keccak256(ethers.toUtf8Bytes("0G-COMPUTE-INFERENCE-SIGNATURE-1"));
  const mockProspectusRoot = ethers.keccak256(ethers.toUtf8Bytes("0G-PROSPECTUS-ROOT-1"));

  async function deployCredenceFixture() {
    const [owner, oracle, agentPrime, agentSubprime, investor1, investor2] = await ethers.getSigners();

    // 1. Deploy Registry
    const registryFactory = await ethers.getContractFactory("AgentCreditRegistry");
    const registry = (await registryFactory.deploy()) as AgentCreditRegistry;
    await registry.waitForDeployment();
    await registry.setOracle(oracle.address);

    // 2. Deploy Escrow
    const escrowFactory = await ethers.getContractFactory("AgentBondEscrow");
    const escrow = (await escrowFactory.deploy()) as AgentBondEscrow;
    await escrow.waitForDeployment();

    // 3. Deploy Market
    const marketFactory = await ethers.getContractFactory("AgentBondMarket");
    const market = (await marketFactory.deploy(
      await registry.getAddress(),
      await escrow.getAddress()
    )) as AgentBondMarket;
    await market.waitForDeployment();

    // Authorize Market in Escrow
    await escrow.setBondMarket(await market.getAddress());

    return { registry, escrow, market, owner, oracle, agentPrime, agentSubprime, investor1, investor2 };
  }

  describe("1. AgentCreditRegistry — Two-Phase Confirmable Proof Writes", function () {
    it("Phase 1: Oracle proposes credit proof and sets challenge window", async function () {
      const { registry, oracle, agentPrime } = await loadFixture(deployCredenceFixture);

      const tx = await registry.connect(oracle).proposeCreditProof(
        agentPrime.address,
        "ArbitrageAgent-Prime",
        820,
        "AAA",
        mockReportRoot,
        mockComputeSig
      );
      await tx.wait();

      const proofId = await registry.latestProofByAgent(agentPrime.address);
      const proposal = await registry.getProofProposal(proofId);

      expect(proposal.agent).to.equal(agentPrime.address);
      expect(proposal.creditScore).to.equal(820n);
      expect(proposal.ratingGrade).to.equal("AAA");
      expect(proposal.isConfirmed).to.be.false;

      // Agent is NOT eligible until confirmed
      const eligible = await registry.isAgentEligibleForDebt(agentPrime.address, 600);
      expect(eligible).to.be.false;
    });

    it("Phase 2: Oracle confirms proof immediately, activating agent passport", async function () {
      const { registry, oracle, agentPrime } = await loadFixture(deployCredenceFixture);

      await registry.connect(oracle).proposeCreditProof(
        agentPrime.address,
        "ArbitrageAgent-Prime",
        820,
        "AAA",
        mockReportRoot,
        mockComputeSig
      );
      const proofId = await registry.latestProofByAgent(agentPrime.address);

      await expect(registry.connect(oracle).confirmCreditProof(proofId))
        .to.emit(registry, "ProofConfirmed")
        .withArgs(proofId, agentPrime.address, 820n, "AAA", mockReportRoot);

      const profile = await registry.getAgentProfile(agentPrime.address);
      expect(profile.isVerified).to.be.true;
      expect(profile.creditScore).to.equal(820n);

      const eligible = await registry.isAgentEligibleForDebt(agentPrime.address, 600);
      expect(eligible).to.be.true;
    });

    it("allows community to confirm proof after challenge window expires", async function () {
      const { registry, oracle, agentPrime, investor1 } = await loadFixture(deployCredenceFixture);

      await registry.connect(oracle).proposeCreditProof(
        agentPrime.address,
        "ArbitrageAgent-Prime",
        820,
        "AAA",
        mockReportRoot,
        mockComputeSig
      );
      const proofId = await registry.latestProofByAgent(agentPrime.address);

      // Non-oracle fails before window
      await expect(registry.connect(investor1).confirmCreditProof(proofId))
        .to.be.revertedWith("Challenge window still active");

      // Advance time past 60s challenge window
      await ethers.provider.send("evm_increaseTime", [65]);
      await ethers.provider.send("evm_mine", []);

      // Now anyone can confirm
      await expect(registry.connect(investor1).confirmCreditProof(proofId))
        .to.emit(registry, "ProofConfirmed");
    });

    it("allows oracle to dispute fraudulent proposals", async function () {
      const { registry, oracle, agentSubprime } = await loadFixture(deployCredenceFixture);

      await registry.connect(oracle).proposeCreditProof(
        agentSubprime.address,
        "FakeAgent",
        850,
        "AAA",
        mockReportRoot,
        mockComputeSig
      );
      const proofId = await registry.latestProofByAgent(agentSubprime.address);

      await expect(
        registry.connect(oracle).disputeCreditProof(proofId, "Fraudulent solvency metrics detected")
      ).to.emit(registry, "ProofDisputed");

      // Disputed proof cannot be confirmed
      await expect(registry.connect(oracle).confirmCreditProof(proofId))
        .to.be.revertedWith("Proof is disputed");
    });
  });

  describe("2. Underwriting, Escrow Funding & Capital Disbursement", function () {
    it("rejects unconfirmed or low-score agents from issuing debt", async function () {
      const { market, agentSubprime } = await loadFixture(deployCredenceFixture);

      await expect(
        market.connect(agentSubprime).issueBond(
          ethers.parseEther("1.0"),
          500,
          86400 * 30,
          mockProspectusRoot
        )
      ).to.be.revertedWith("Credit score too low or unconfirmed on 0G");
    });

    it("escrows subscription funds and disburses to agent upon 100% funding goal", async function () {
      const { registry, market, oracle, agentPrime, investor1, investor2 } = await loadFixture(deployCredenceFixture);

      // Confirm Agent Prime
      await registry.connect(oracle).proposeCreditProof(
        agentPrime.address,
        "ArbitrageAgent-Prime",
        820,
        "AAA",
        mockReportRoot,
        mockComputeSig
      );
      const proofId = await registry.latestProofByAgent(agentPrime.address);
      await registry.connect(oracle).confirmCreditProof(proofId);

      const goal = ethers.parseEther("2.0");
      await market.connect(agentPrime).issueBond(goal, 500, 86400 * 30, mockProspectusRoot);

      const agentBalBefore = await ethers.provider.getBalance(agentPrime.address);

      // Investor 1 funds 1.2 ETH into escrow
      await market.connect(investor1).subscribeToBond(1, { value: ethers.parseEther("1.2") });
      let bond = await market.getBond(1);
      expect(bond.totalRaised).to.equal(ethers.parseEther("1.2"));
      expect(bond.status).to.equal(0n); // Funding

      // Investor 2 funds the remaining 0.8 ETH
      await market.connect(investor2).subscribeToBond(1, { value: ethers.parseEther("0.8") });
      bond = await market.getBond(1);
      expect(bond.status).to.equal(1n); // Active

      // Verify agent received funds from escrow
      const agentBalAfter = await ethers.provider.getBalance(agentPrime.address);
      expect(agentBalAfter - agentBalBefore).to.equal(goal);
    });
  });

  describe("3. Repayment Waterfall, Escrow Payouts & Default Penalties", function () {
    it("handles exact repayment and proportional escrow yield claims", async function () {
      const { registry, market, oracle, agentPrime, investor1, investor2 } = await loadFixture(deployCredenceFixture);

      // Confirm Agent Prime
      await registry.connect(oracle).proposeCreditProof(
        agentPrime.address,
        "ArbitrageAgent-Prime",
        820,
        "AAA",
        mockReportRoot,
        mockComputeSig
      );
      const proofId = await registry.latestProofByAgent(agentPrime.address);
      await registry.connect(oracle).confirmCreditProof(proofId);

      const goal = ethers.parseEther("2.0");
      const couponBps = 500n; // 5% = 0.1 ETH interest

      await market.connect(agentPrime).issueBond(goal, couponBps, 86400 * 30, mockProspectusRoot);
      await market.connect(investor1).subscribeToBond(1, { value: ethers.parseEther("1.5") }); // 75%
      await market.connect(investor2).subscribeToBond(1, { value: ethers.parseEther("0.5") }); // 25%

      const required = await market.calculateRepaymentAmount(1);
      expect(required).to.equal(ethers.parseEther("2.1"));

      // Repay into escrow
      await expect(market.connect(agentPrime).repayBond(1, { value: required }))
        .to.emit(market, "BondRepaid")
        .withArgs(1n, required);

      // Investor 1 claims 75% of 2.1 ETH = 1.575 ETH
      const inv1BalBefore = await ethers.provider.getBalance(investor1.address);
      const tx1 = await market.connect(investor1).claimYield(1);
      const rec1 = await tx1.wait();
      const gas1 = rec1!.gasUsed * rec1!.gasPrice;
      const inv1BalAfter = await ethers.provider.getBalance(investor1.address);

      expect(inv1BalAfter + gas1 - inv1BalBefore).to.equal(ethers.parseEther("1.575"));

      // Investor 2 claims 25% of 2.1 ETH = 0.525 ETH
      const inv2BalBefore = await ethers.provider.getBalance(investor2.address);
      const tx2 = await market.connect(investor2).claimYield(1);
      const rec2 = await tx2.wait();
      const gas2 = rec2!.gasUsed * rec2!.gasPrice;
      const inv2BalAfter = await ethers.provider.getBalance(investor2.address);

      expect(inv2BalAfter + gas2 - inv2BalBefore).to.equal(ethers.parseEther("0.525"));
    });
  });
});
