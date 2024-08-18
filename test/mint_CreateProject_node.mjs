// mint_CreateProject.js

import dotenv from "dotenv";
dotenv.config();
import HumbleDonations from "../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };
import { ethers } from "ethers";

const contractAddress = "0x977428b2547A247848E2DD736B760c80da192b06";

const recieverAddress = "0xF0f472619cCE62B7d54dF3Bf17c4335EF311F1A5";

const privateKey = process.env.PRIVATE_KEY;

const API_URL = process.env.API_URL_SEPOLIA;

const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const { abi } = HumbleDonations;

const contract = new ethers.Contract(contractAddress, abi, wallet);

async function main() {
  const read_mintRate = await contract.get_mintRate();
  const uri = ""; /*
  This is frontend logic that isn't important to the contract. 
  Regardless of what you pass as `uri`, the minted tokenId can be viewed from the frontend https://www.humbledonations.com/donate
  if minted with contradAddress "0x977428b2547A247848E2DD736B760c80da192b06"

  Essentially, formatting the uri as a JSON with the following fields will create a dynamic route on the frontend. 
  An example uri below:
  {"title":"Example Title","body":"Example Description","tag":["DeFi"],"website":"https://humbledonations.com","twitter":"","discord":"","youtube":"","twitch":"","reel":"","github":"N0repi"}

  Is being rendered on https://www.humbledonations.com/projects/Example%20Title
  */
  const projectTitle = "projectTestID4"; // any name that has not been previously used will suffice

  const mintTokens = await contract.safeMint(
    recieverAddress,
    uri,
    projectTitle,
    {
      value: read_mintRate,
    }
  );

  console.log(
    //`Transaction Hash: https://sepolia.etherscan.io/tx/${mintTokens.hash}`,
    `Transaction Hash: https://sepolia.etherscan.io/tx/${mintTokens.hash}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// await humbleDonations.waitForDeployment();

// const deploymentAddress = await humbleDonations.getAddress();

// console.log(
//   `Deployed to https://sepolia.etherscan.io/address/${deploymentAddress}`
// );
// }
