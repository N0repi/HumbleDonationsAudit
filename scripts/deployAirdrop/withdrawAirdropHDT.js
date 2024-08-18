// withdraw-AirdropHDT.js

// Deployed to https://sepolia.etherscan.io/address/0xf521011e7CAc5386DFdE3Db8bCcB77210CC1A479

// 0xf521011e7CAc5386DFdE3Db8bCcB77210CC1A479

import hardhat from "hardhat";
const { ethers } = hardhat;

const contractAddress = "0xC8651777EB23A33E17e7A41C07dd73bA45Ff751b";
// Constructor params
const HDT = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";
const withdrawAmount = ethers.parseUnits("2000", 18);
console.log("withdrawAmount: ", withdrawAmount);

async function main() {
  const AirdropHDT = await ethers.getContractFactory("AirdropHDT");
  const airdropHDT = await AirdropHDT.attach(contractAddress);

  const withdraw = await airdropHDT.withdrawToken(HDT, withdrawAmount);

  await withdraw.wait();

  console.log(`Withdraw TX https://sepolia.etherscan.io/tx/${withdraw.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
