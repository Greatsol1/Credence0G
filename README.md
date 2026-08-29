# Credence0G (AgentBonds)

> **Autonomous AI Agent Credit Bureau & On-Chain Debt Market on 0G Chain, 0G Storage, and 0G Compute.**

![0G Mainnet](https://img.shields.io/badge/0G_Mainnet-16661-purple?style=for-the-badge)
![0G Testnet](https://img.shields.io/badge/0G_Testnet-16602-indigo?style=for-the-badge)
![0G Storage](https://img.shields.io/badge/0G_Storage-Turbo_Indexer-violet?style=for-the-badge)

---

## 🏛️ Live Deployed Smart Contracts

### 0G Aristotle Mainnet (Chain ID: `16661`)
- **RPC Endpoint**: `https://evmrpc.0g.ai`
- **Block Explorer**: `https://chainscan.0g.ai`

| Contract Name | Deployed Address | Mainnet Explorer |
| :--- | :--- | :--- |
| **`AgentBondMarket`** | `0x73aE0dC431C9c3E05dcAFCC7831B43d2643668c8` | [View on 0G Mainnet Explorer](https://chainscan.0g.ai/address/0x73aE0dC431C9c3E05dcAFCC7831B43d2643668c8) |
| **`AgentCreditRegistry`** | `0x0ba18878D80D7D901EbC0165f76dBe77f96B0F03` | [View on 0G Mainnet Explorer](https://chainscan.0g.ai/address/0x0ba18878D80D7D901EbC0165f76dBe77f96B0F03) |
| **`AgentBondEscrow`** | `0x66380e69c44b079d9D4E5316E60a8b54C8754796` | [View on 0G Mainnet Explorer](https://chainscan.0g.ai/address/0x66380e69c44b079d9D4E5316E60a8b54C8754796) |

#### Mined On-Chain Transactions (0G Mainnet):
- **Credit Proof Proposal**: [`0x5e5b7159de84290a674bee8880a5dc487b23959f8b37aa51265363988e0c57ee`](https://chainscan.0g.ai/tx/0x5e5b7159de84290a674bee8880a5dc487b23959f8b37aa51265363988e0c57ee)
- **Credit Proof Confirmation**: [`0x56b63b401f324ef7eb30e3a25127e63cf4ed1ba838af9c2abfc2cd412d78dc59`](https://chainscan.0g.ai/tx/0x56b63b401f324ef7eb30e3a25127e63cf4ed1ba838af9c2abfc2cd412d78dc59)
- **Bond Series #1 Issuance**: [`0xd9666203ecf38f06df6abefa89e27708c4d6a0b6dd82a613f30a033a03dbee62`](https://chainscan.0g.ai/tx/0xd9666203ecf38f06df6abefa89e27708c4d6a0b6dd82a613f30a033a03dbee62)

---

### 0G Galileo Testnet (Chain ID: `16602`)
- **RPC Endpoint**: `https://evmrpc-testnet.0g.ai`
- **Block Explorer**: `https://chainscan-galileo.0g.ai`

| Contract Name | Deployed Address | Testnet Explorer |
| :--- | :--- | :--- |
| **`AgentBondMarket`** | `0xaC588096bd844c9c823dAb0628c6a30b8C240D62` | [View on 0G Testnet Explorer](https://chainscan-galileo.0g.ai/address/0xaC588096bd844c9c823dAb0628c6a30b8C240D62) |
| **`AgentCreditRegistry`** | `0xaBF81109dd950cdDA067486D59562aEa128b37d2` | [View on 0G Testnet Explorer](https://chainscan-galileo.0g.ai/address/0xaBF81109dd950cdDA067486D59562aEa128b37d2) |
| **`AgentBondEscrow`** | `0x33096422BEf096A6c02AE59f62B9F7ab602f5A5e` | [View on 0G Testnet Explorer](https://chainscan-galileo.0g.ai/address/0x33096422BEf096A6c02AE59f62B9F7ab602f5A5e) |

---

## 🎯 What Credence0G Does

1. **Verifiable AI Risk Assessment (0G Compute + Groq LLM)**: Connects to 0G Compute Router Gateway (`router-api.0g.ai`) and Groq AI Underwriter to analyze agent wallet solvency, operational throughput, and past debt track records with cryptographic verification hashes (`computeSignatureRoot`).
2. **Permanent Audit Archival (0G Storage Turbo)**: Archives structured JSON-LD credit audit reports directly to the 0G Storage Turbo Indexer (`https://indexer-storage-testnet-turbo.0g.ai`) with deterministic 256KB segment Merkle tree roots.
3. **Multi-Contract Debt Architecture (0G Chain)**:
   - [`AgentCreditRegistry.sol`](./contracts/AgentCreditRegistry.sol): Soulbound credit passports with **two-phase confirmable proof writes** (`proposeCreditProof` → challenge window → `confirmCreditProof`) preventing fire-and-forget vulnerabilities.
   - [`AgentBondEscrow.sol`](./contracts/AgentBondEscrow.sol): Non-custodial escrow managing investor subscriptions, proof-gated disbursements, and yield claims.
   - [`AgentBondMarket.sol`](./contracts/AgentBondMarket.sol): Micro-bond debt market with automated disbursement, repayment waterfalls, and default penalization.
4. **Interactive Three.js 3D WebGL DApp**: Interactive 3D agent credit constellation and harmonic golden yield curve surface on [`frontend/index.html`](./frontend/index.html).

---

## 🚀 Quickstart & Verification Commands

### 1. Installation
```bash
npm install
```

### 2. Run Comprehensive Multi-Contract Unit Tests
```bash
npm run test:contracts
```

### 3. Run Live 0G Network Diagnostic & Full Execution Flow
```bash
npm run verify:0g
```

### 4. Launch Interactive 3D DApp
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📜 License
MIT
