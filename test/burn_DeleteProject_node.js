// burn_DeleteProject_node.js;

import dotenv from "dotenv";
dotenv.config();
import HumbleDonations from "../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };
import { ethers } from "ethers";

const contractAddress = "0x977428b2547A247848E2DD736B760c80da192b06";

const privateKey = process.env.PRIVATE_KEY2;

const API_URL = process.env.API_URL_SEPOLIA;

const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const { abi } = HumbleDonations;

const contract = new ethers.Contract(contractAddress, abi, wallet);

async function main() {
  /*
  There is no get-hook in the contract which returns the tokenId of a project.
  In the frontend, this is handled by The Graph indexing the emitted event at the end of `safeMint`
  */
  const tokenId = "11";

  const burnTokenTx = await contract.burnToken(tokenId);

  console.log(
    `Transaction Hash: https://sepolia.etherscan.io/tx/${burnTokenTx.hash}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
