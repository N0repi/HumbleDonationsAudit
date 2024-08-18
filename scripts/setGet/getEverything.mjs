// GetEverything.mjs

import dotenv from "dotenv";
dotenv.config();
import HumbleDonations from "../../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };
import { ethers } from "ethers";

const contractAddress = "0x977428b2547A247848E2DD736B760c80da192b06";

const privateKey = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL_SEPOLIA;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);
console.log("wallet:", wallet);

const { abi } = HumbleDonations;

const contract = new ethers.Contract(contractAddress, abi, provider);

async function callGetEverything() {
  try {
    const upgradeCount = await contract.getUpgradeCount();
    console.log("Upgrade Count:", upgradeCount.toString());

    const HDT = await contract.getHDT();
    console.log("HDT Address:", HDT);

    const WETH = await contract.getWETH();
    console.log("WETH Address:", WETH);

    const taxPercentage = await contract.getPercentage();
    console.log("Tax Percentage:", taxPercentage.toString());

    // const mintRate = await contract.get_mintRate();
    // console.log("Mint Rate:", mintRate.toString());

    const latestTokenId = await contract.latestTokenId();
    console.log("Latest Token ID:", latestTokenId.toString());

    const projectTitle = "Test Title2"; // replace with actual project title
    const tokenId = await contract.getTokenId(projectTitle);
    console.log("Token ID for project title:", tokenId.toString());

    const ownerByProjectTitle = await contract.getOwnerByProjectTitle(
      projectTitle
    );
    console.log("Owner for project title:", ownerByProjectTitle);
  } catch (error) {
    console.error("Error getting contract data:", error);
  }
}

callGetEverything();
