// deploy-HumbleDonations.js

// Sepolia address: 0xc0D69FE23f5B83EcFBC5D0A5025f780170BeB529

require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

async function main() {
  const HumbleDonations = await ethers.getContractFactory("HumbleDonations");

  const recipientAddress = process.env.MY_ADDRESS;

  const humbleDonations = await upgrades.deployProxy(
    HumbleDonations,
    [recipientAddress],
    { initializer: "initialize" }
  );

  await humbleDonations.waitForDeployment();

  const deploymentAddress = await humbleDonations.getAddress();

  console.log(
    `Deployed to https://sepolia.etherscan.io/address/${deploymentAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
