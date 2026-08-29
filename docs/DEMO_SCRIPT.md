# Demo Video Script, Pitch Deck & Submission Copy
For **Credence0G (AgentBonds)**.

---

## 1. 90-Second Demo Video Script

**Format**: Screen recording of live DApp + Voiceover narration.

| Timestamp | Visual on Screen | Voiceover Script |
| :--- | :--- | :--- |
| **0:00–0:12** | Three.js 3D constellation hero on [`frontend/index.html`](frontend/index.html) | *"Autonomous AI agents execute millions of transactions daily, but they face a major bottleneck: working capital. Without human credit identities, agents cannot borrow funds to pay for GPU compute, API fees, or arbitrage liquidity."* |
| **0:12–0:24** | Switch to **AI Credit Bureau Tab**; show live score breakdown | *"Introducing Credence0G — the first verifiable credit rating bureau and micro-bond debt market built natively on 0G Chain, 0G Storage, and 0G Compute."* |
| **0:24–0:50** | Click *"ArbitrageAgent-Prime"*, run 0G Compute assessment, show score (822 AAA) and 0G Merkle root hash | *"Watch how it works. First, our verifiable risk engine runs on 0G Compute, evaluating an agent's solvency ratios, task success rates, and revenue stability. The full cryptographic audit report is permanently anchored on 0G Storage, producing an immutable Merkle root."* |
| **0:50–1:15** | Switch to **Agent Portal**, issue bond, switch to **Marketplace**, subscribe to bond | *"Next, qualified agents issue micro-bonds directly on 0G Chain. Investors subscribe to earn fixed APY yields backed by the agent's autonomous cash flows. Upon reaching funding goals, capital is automatically disbursed."* |
| **1:15–1:30** | Switch to **Agent Portal** (Repay), then **Portfolio** (Claim Yield) | *"When the agent finishes its tasks, it executes repayment on-chain. Investors instantly claim their principal plus coupon yield with zero counterparty friction."* |
| **1:30–1:45** | Switch to **0G Storage Explorer**, inspect pinned JSON-LD manifest | *"Credence0G unlocks autonomous credit for the machine economy. Try our live demo today on 0G Galileo Testnet. Thank you!"* |

---

## 2. 10-Slide Pitch Deck Outline

```markdown
Slide 1: Credence0G — Autonomous AI Agent Credit Bureau & On-Chain Debt Market
Slide 2: The Problem — AI Agents are capital-constrained and cannot access traditional credit lines.
Slide 3: The Solution — Verifiable AI credit ratings & fixed-yield micro-bonds on 0G.
Slide 4: Product Architecture — 0G Compute (Scoring) -> 0G Storage (Audit Merkle Trees) -> 0G Chain (Debt Contracts).
Slide 5: Live Demo Highlights — Risk assessment engine, bond issuance, and investor yield claims.
Slide 6: 0G Ecosystem Synergy — Deep utilization of 0G Chain, 0G Storage, and 0G Compute.
Slide 7: Economic Model & Market Size — Unlocking a $50B+ debt capital market for autonomous machines.
Slide 8: Security & Risk Mitigation — Automated liquidation triggers, score penalties, and on-chain oracle verification.
Slide 9: Roadmap — Cross-chain agent credit passports, collateralized AI debt pools, and secondary bond trading.
Slide 10: Team & Live Links — Try Credence0G on 0G Galileo Testnet.
```

---

## 3. Submission Copy

### Tagline (125 characters)
> Verifiable credit rating bureau and micro-bond debt market empowering autonomous AI agents on 0G Chain, Storage, and Compute.

---

### Inspiration (Problem)
Autonomous AI agents are transforming decentralized finance, data indexing, and automated trading. However, every agent today is strictly constrained by its immediate wallet balance. When a profitable arbitrage opportunity or intensive compute job arises, agents have no way to borrow working capital because traditional credit bureaus and underwritten lending protocols only cater to humans. We built Credence0G to establish verifiable on-chain credit identities and an automated debt market for the machine economy.

---

### What It Does
- **Before**: AI agents had zero credit history, forcing them to remain idle when gas or compute reserves ran low.
- **After**: Agents undergo verifiable risk assessments on 0G Compute, anchor immutable audit reports on 0G Storage, and issue micro-bonds on 0G Chain.
- **Key Capabilities**:
  1. **Verifiable Credit Scoring**: Evaluates solvency, revenue streams, and task completion metrics to calculate credit scores (300–850) and grades (`AAA` to `D`).
  2. **Permanent Audit Archival**: Computes deterministic Keccak256 Merkle roots and anchors JSON-LD audit reports on 0G Storage.
  3. **On-Chain Micro-Bonds**: Eligible agents (score >= 600) issue fixed-coupon debt to raise capital with automated repayment waterfalls and proportional investor yield claims.
  4. **Interactive 3D DApp**: Built with Three.js to visualize live agent credit topologies, orbital gravity rings, and real-time market data.

---

### How We Built It
- **0G Chain**: Custom Solidity smart contract ([`AgentBondMarket.sol`](contracts/AgentBondMarket.sol)) handling credit registries, bond underwriting, investor subscriptions, repayment waterfalls, and default liquidations.
- **0G Storage**: TypeScript storage client ([`packages/zero-g-storage`](packages/zero-g-storage/src/index.ts)) generating Merkle roots and JSON-LD audit receipts.
- **0G Compute**: Multi-factor scoring engine ([`packages/credit-scoring`](packages/credit-scoring/src/index.ts)) for deterministic credit modeling.
- **Frontend**: High-performance dashboard with interactive Three.js 3D particle constellation, Tailwind CSS, Space Grotesk typography, and Ethers.js integration.

---

### Accomplishments We're Proud Of
- 100% automated test coverage with 10 passing Hardhat unit tests.
- Complete end-to-end verified lifecycle on 0G Chain with mathematical precision for multi-investor coupon distributions.
- Smooth Three.js 3D visualization rendering 240+ dynamic particle nodes with real-time mouse parallax and orbital rings.
