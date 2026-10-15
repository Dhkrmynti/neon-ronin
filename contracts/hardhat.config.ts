import type { HardhatUserConfig } from "hardhat/config";
import { configVariable } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    // Both values come from the encrypted keystore: `npx hardhat keystore set SEPOLIA_RPC_URL` and `... SEPOLIA_PRIVATE_KEY`.
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    // Robinhood Chain mainnet, the chain the token projects in this folder run on. Real ETH.
    // The key comes from the encrypted keystore: `npx hardhat keystore set ROBINHOOD_PRIVATE_KEY`.
    robinhood: {
      type: "http",
      chainType: "generic",
      url: process.env.ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com",
      accounts: [configVariable("ROBINHOOD_PRIVATE_KEY")],
    },
  },
};

export default config;
