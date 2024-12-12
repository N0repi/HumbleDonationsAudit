require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Step 1: Deploy the Create2Deployer contract
  const Create2Deployer = await ethers.getContractFactory("Create2Deployer");
  const create2Deployer = await Create2Deployer.deploy();
  await create2Deployer.waitForDeployment();
  const deploymentAddressSalt = await create2Deployer.getAddress();
  console.log("Create2Deployer deployed at:", deploymentAddressSalt);

  // Step 2: Prepare HumbleDonations bytecode
  const HumbleDonations = await ethers.getContractFactory("HumbleDonations");
  const initData = HumbleDonations.interface.encodeFunctionData("initialize", [
    process.env.MY_ADDRESS,
  ]);
  const bytecode = ethers.concat([HumbleDonations.bytecode, initData]);

  // Step 3: Choose a salt
  const salt = ethers.keccak256(ethers.toUtf8Bytes("unique_salt_value"));

  // Step 4: Deploy with CREATE2 and retrieve the address
  const tx = await create2Deployer.deploy(salt, bytecode);
  const receipt = await tx.wait();
  const event = receipt.logs.find((log) => log.event === "ContractDeployed");
  const humbleDonationsAddress = event.args[0]; // Assuming ContractDeployed emits the deployed address as the first argument

  console.log(
    `Deployed to https://sepolia.etherscan.io/address/${humbleDonationsAddress}`
  );
  console.log(`Deployed to predetermined address: ${humbleDonationsAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
