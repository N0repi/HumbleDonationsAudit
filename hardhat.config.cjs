require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {},
    sepolia: {
      chainID: 11155111,
      url: process.env.API_URL_SEPOLIA,
      accounts: [process.env.PRIVATE_KEY],
    },
    arbitrum_sepolia: {
      chainID: 421614,
      url: process.env.API_URL_ARBITRUMSEPOLIA,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
    },
  },
};
