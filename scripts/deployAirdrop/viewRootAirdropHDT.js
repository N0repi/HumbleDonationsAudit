// viewRootAirdropHDT.js

// Deployed to https://sepolia.etherscan.io/address/0x37c28a13c2065eb8889a6f8B7f02AdEd531A5Bd5

// 0x37c28a13c2065eb8889a6f8B7f02AdEd531A5Bd5

import hardhat from "hardhat";
const { ethers } = hardhat;

const contractAddress = "0xC8651777EB23A33E17e7A41C07dd73bA45Ff751b";
// Constructor params

async function main() {
  const AirdropHDT = await ethers.getContractFactory("AirdropHDT");
  const airdropHDT = await AirdropHDT.attach(contractAddress);

  const viewMerkleRoot = await airdropHDT.getMerkleRoot();

  await viewMerkleRoot;
  console.log(viewMerkleRoot); // 0x35d22b085d1bf4b973bdc1818effbc38de0f081fa89fa8eede5e0654b21353b3
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
