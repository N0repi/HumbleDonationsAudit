// setEssentials.mjs

import dotenv from "dotenv";
dotenv.config();
import HumbleDonations from "../../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };
import { ethers } from "ethers";

const contractAddress = "0xFC755304f755849e5df3A754a3Cf2D1b18d0e0BF";

const privateKey = process.env.PRIVATE_KEY;

const API_URL = process.env.API_URL_ARBITRUMSEPOLIA;

const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const { abi } = HumbleDonations;

const contract = new ethers.Contract(contractAddress, abi, wallet);

const HDT = "0x301944751abB2F5000C71B050b139e31AEaE4720";
const WETH = "0x67e197D575e7A350Ff3dE1A7eAd2aA06b19145B6";

const taxValue = 15; // 150 == 15%

async function setVariables() {
  try {
    const txHDT = await contract.setHDT(HDT);
    await txHDT.wait();
    console.log("HDT set successfully!");
    const txWETH = await contract.setWETH(WETH);
    await txWETH.wait();
    console.log("WETH set successfully!");
  } catch (error) {
    console.error("Error setting", error);
  }
}

setVariables();
