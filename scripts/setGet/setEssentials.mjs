// setEssentials.mjs

import dotenv from "dotenv";
dotenv.config();
import HumbleDonations from "../../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };
import { ethers } from "ethers";

import { callCompute } from "../whiteList/merkleRoot.mjs";

const contractAddress = "0xc0D69FE23f5B83EcFBC5D0A5025f780170BeB529";

const privateKey = process.env.PRIVATE_KEY;

const API_URL = process.env.API_URL_SEPOLIA;

const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const { abi } = HumbleDonations;

const contract = new ethers.Contract(contractAddress, abi, wallet);

const HDT = "0x9707be4129f68b767af550fe1c631bf1779623cb";
const WETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";

const taxValue = 15; // 150 == 15%

async function setVariables() {
  try {
    const txHDT = await contract.setHDT(HDT);
    await txHDT.wait();
    console.log("HDT set successfully!");

    const txWETH = await contract.setWETH(WETH);
    await txWETH.wait();
    console.log("WETH set successfully!");

    const merkleRoot = await callCompute();
    console.log("Merkle Root from callCompute:", merkleRoot);
    const txWhiteList = await contract.setMerkleRoot(merkleRoot);
    await txWhiteList.wait();
    console.log("Token Whitelist set successfully!");
  } catch (error) {
    console.error("Error setting", error);
  }
}

setVariables();
