require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

async function main() {
  const create2DeployerAddress = "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2";
  const recipientAddress = process.env.MY_ADDRESS;

  // Connect to the existing Create2Deployer
  const create2Deployer = await ethers.getContractAt(
    "Create2Deployer",
    create2DeployerAddress
  );

  // Step 1: Prepare HumbleDonations implementation bytecode
  const HumbleDonations = await ethers.getContractFactory("HumbleDonations");
  const bytecode = HumbleDonations.bytecode;
  const salt = ethers.keccak256(ethers.toUtf8Bytes("unique_salt_value"));

  // Step 2: Deploy HumbleDonations implementation with CREATE2
  try {
    const tx = await create2Deployer.deploy(salt, bytecode, {
      gasLimit: 3000000, // Set an adequate gas limit for CREATE2 deployment
    });
    const receipt = await tx.wait();

    // Calculate expected deployment address
    const implementationAddress = ethers.getCreate2Address(
      create2DeployerAddress,
      salt,
      ethers.keccak256(bytecode)
    );

    console.log(
      `Implementation deployed at: https://testnet.soniclabs.com/address/${implementationAddress}`
    );

    // Step 3: Deploy the UUPS Proxy
    const humbleDonationsProxy = await upgrades.deployProxy(
      HumbleDonations.attach(implementationAddress),
      [recipientAddress],
      { initializer: "initialize" }
    );
    await humbleDonationsProxy.waitForDeployment();
    const proxyAddress = await humbleDonationsProxy.getAddress();

    // Step 4: Verify Proxy and Implementation addresses
    const finalImplementationAddress =
      await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("------HumbleDonations------");
    console.log(
      `Proxy deployed to https://testnet.soniclabs.com/address/${proxyAddress}`
    );
    console.log(
      `Implementation deployed to https://testnet.soniclabs.com/address/${finalImplementationAddress}`
    );
  } catch (error) {
    console.error("Error during deployment:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
