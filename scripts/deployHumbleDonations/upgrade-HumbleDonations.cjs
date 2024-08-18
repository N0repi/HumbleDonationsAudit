// upgrade-HumbleDonations.js

require("dotenv").config();

const { ethers, upgrades } = require("hardhat");

const MY_ADDRESS = process.env.MY_ADDRESS;
const Proxy = "0x977428b2547A247848E2DD736B760c80da192b06";

async function main() {
  const latestBlock = await hre.ethers.provider.getBlock("latest");

  const HumbleDonations = await ethers.getContractFactory("HumbleDonations");

  const humbleDonations = await upgrades.upgradeProxy(Proxy, HumbleDonations);

  await humbleDonations.waitForDeployment();
  const deploymentAddress = await humbleDonations.getAddress();

  console.log(
    `Deployed to https://sepolia.etherscan.io/address/${deploymentAddress}`
  );
  console.log(
    "deployed hash",
    { humbleDonations },
    `Deploy contract and schedule open on block ${latestBlock.timestamp}`,
    ("Proxy Contract deployed to address:", humbleDonations.address)
  );
  console.log("Logic Contract deployed to address:", humbleDonations);
}

//   console.log("Contract deployed to address:", HumbleDonations.address);
// }

/*
---Poxy & implementation---
0xa653f4d5241332d30395761645763c6ff383b31f | implementation
0xbA98b648513b31ADC84F07Bb1eF058EE87965707 | proxy
*/
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
