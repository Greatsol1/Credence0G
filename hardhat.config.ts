import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Official 0G Galileo Testnet
    zeroGGalileo: {
      url: process.env.ZERO_G_TESTNET_RPC || "https://evmrpc-testnet.0g.ai",
      accounts: [PRIVATE_KEY],
      chainId: 16602,
    },
    // 0G Galileo Legacy RPC
    zeroGTestnet: {
      url: process.env.ZERO_G_TESTNET_LEGACY_RPC || "https://rpc-testnet.0g.ai",
      accounts: [PRIVATE_KEY],
      chainId: 16600,
    },
    // Official 0G Aristotle Mainnet
    zeroGMainnet: {
      url: process.env.ZERO_G_MAINNET_RPC || "https://evmrpc.0g.ai",
      accounts: [PRIVATE_KEY],
      chainId: 16661,
    },
  },
};

export default config;
