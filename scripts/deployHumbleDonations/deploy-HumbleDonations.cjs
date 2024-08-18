// deploy-HumbleDonations.js

// Sepolia address: 0x977428b2547A247848E2DD736B760c80da192b06
// implementation: 0x72BBf9d2EBf7E79D56B071DcB28ffDCef95B4D0f

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
