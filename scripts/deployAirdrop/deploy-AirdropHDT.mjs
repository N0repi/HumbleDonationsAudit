// deploy-AirdropHDT.js

// 4

// Deployed to https://sepolia.etherscan.io/address/0xf521011e7CAc5386DFdE3Db8bCcB77210CC1A479

// 0xf521011e7CAc5386DFdE3Db8bCcB77210CC1A479

// newest
// https://sepolia.etherscan.io/address/0xed24e9AF4caaAea1fF721C4274635821C2d76651
// 0xed24e9AF4caaAea1fF721C4274635821C2d76651

// deploy Merkle Root log:  0x1c42936f1a6baed7d4fc2ed4c46d784437f1c3897a66115c6a2395b114a530b6
// Deployed to https://sepolia.etherscan.io/address/0xC8651777EB23A33E17e7A41C07dd73bA45Ff751b

import hardhat from "hardhat";
const { ethers } = hardhat;

import generateMerkleTree from "./genMerkleRoot.mjs";

// Constructor params
const HDT = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";

async function main() {
  const MerkleRoot = await generateMerkleTree();
  console.log("deploy Merkle Root log: ", MerkleRoot);

  const AirdropHDT = await ethers.getContractFactory("AirdropHDT");

  const airdropHDT = await AirdropHDT.deploy(
    HDT,
    "0x8e28cfcf2d4ad44c5d8f49ce71c51900201c6397741bfd2318afb66578be99d6"
  );

  await airdropHDT.waitForDeployment();

  const deploymentAddress = await airdropHDT.getAddress();

  console.log(
    `Deployed to https://sepolia.etherscan.io/address/${deploymentAddress}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
