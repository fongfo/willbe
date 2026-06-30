import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';

// Secrets come from the environment only — never hardcode RPC URLs or keys, and
// never commit `.env` (see `.env.example`). Missing values fall back to safe
// placeholders so `compile`/`test` work offline without any credentials.
const AMOY_RPC_URL = process.env.AMOY_RPC_URL ?? 'https://rpc-amoy.polygon.technology';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? '';
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY ?? '';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    // Polygon Amoy testnet — chain id 80002. Deployment requires a funded
    // DEPLOYER_PRIVATE_KEY in the environment; CI only compiles + tests locally.
    amoy: {
      url: AMOY_RPC_URL,
      chainId: 80002,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: { polygonAmoy: POLYGONSCAN_API_KEY }
  }
};

export default config;
