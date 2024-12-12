// WETH9.cjs

require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const WETH9 = await ethers.getContractFactory("WETH9");

  const _WETH9 = await WETH9.deploy(); // Instance of the contract
  // await _WETH9;
  await _WETH9.waitForDeployment();

  // const paymentReceipt = await nOC19SepoliaUUPS.wait();
  // console.log("Transaction Receipt:", paymentReceipt)
  const deploymentAddress = await _WETH9.getAddress();
  console.log(
    `Deployed to https://public-sonic.fantom.network/address/${deploymentAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
