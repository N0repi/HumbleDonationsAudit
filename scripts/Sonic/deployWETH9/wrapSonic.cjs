// wrapSonic.cjs

require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const wethAddress = "0x54c3F0c4AfA850Ce839994aE6512699d4dD9b075";

  const amountToWrap = ethers.parseEther("1"); // Replace with the desired amount

  const [signer] = await ethers.getSigners();
  const WETH9 = await ethers.getContractAt("WETH9", wethAddress, signer);

  // Wrap Sonic
  const tx = await WETH9.deposit({ value: amountToWrap });
  await tx.wait();

  console.log(
    `Wrap Transaction: https://public-sonic.fantom.network/tx/${tx.hash}`
  );

  console.log(`Wrapped ${ethers.formatEther(amountToWrap)} $S into WETH`);

  /* 
  Output 
  https://public-sonic.fantom.network/tx/0x17cf35011d5984f69bbf362fe4b9f137e9751e2226f2deecf72f96898068a55c
  Wrapped 1.0 $S into WETH
  */

  const balance = await WETH9.balanceOf(signer.address);
  console.log(`Wrapped balance: ${ethers.formatEther(balance)} WETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
