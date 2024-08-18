import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import USDT_mainnet from "./tokenABI/USDT_mainnet.json" assert { type: "json" };
import { computeMerkleProof } from "../scripts/whiteList/merkleProof.mjs";
import HumbleDonations from "../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };

const { abi: HumbleDonationsAbi } = HumbleDonations;

const USDT_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0"; // Sepolia | 6 decimals
const WALLET_ADDRESS = "0xF0f472619cCE62B7d54dF3Bf17c4335EF311F1A5"; // Your wallet address
const WALLET_SECRET = process.env.PRIVATE_KEY2;
const API_URL = process.env.API_URL_SEPOLIA; // Sepolia
const provider = new ethers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(WALLET_SECRET, provider);

const contractAddress = "0x977428b2547A247848E2DD736B760c80da192b06";
const tokenAddress = USDT_ADDRESS;
const amountIn = ethers.parseUnits("100", 6);
console.log("amountIn:", amountIn);

const tokenId = 1;
const ownerAddressOfTokenId = "0xf7ABBCaa52e051d10215414Dd694451Af4bF9111"; // AKA as the recipient of the donation

const slippageWETH = "0";
const slippageHDT = "0";

// HumbleDonations Contract Instance
const HumbleDonationsInstance = new ethers.Contract(
  contractAddress,
  HumbleDonationsAbi,
  signer
);

async function donateUSDT() {
  try {
    console.log("START");

    // Check whitelist via merkle proof
    const proof = await validateToken(tokenAddress);
    const taxPercentage = await HumbleDonationsInstance.getPercentage();
    const taxDecimal = taxPercentage.toString() / 10;
    console.log("Tax Percentage:", taxDecimal.toString(), "%");

    // Initial Balances
    const usdtContract = new ethers.Contract(
      USDT_ADDRESS,
      USDT_mainnet,
      signer
    );
    let usdtBalance = await usdtContract.balanceOf(WALLET_ADDRESS);
    console.log("USDT Balance:", ethers.formatUnits(usdtBalance, 6));

    // Approval
    const approvalTx = await usdtContract.approve(contractAddress, amountIn);
    await approvalTx.wait();
    console.log(
      `Approval successful: https://sepolia.etherscan.io/tx/${approvalTx.hash}`
    );

    // Donation
    console.log("Sending donation...");
    const donateTx = await HumbleDonationsInstance.donate(
      tokenId,
      tokenAddress,
      amountIn,
      slippageWETH,
      slippageHDT,
      proof,
      { gasLimit: 1000000 }
    );
    const donateReceipt = await donateTx.wait();
    console.log(
      `Donation successful: https://sepolia.etherscan.io/tx/${donateTx.hash}`
    );
  } catch (error) {
    console.error("Donation error:", error);
  }
}

donateUSDT();

async function validateToken(tokenInput) {
  console.log("validateToken tokenInput address:", tokenInput);
  const checkWhiteListProof = await computeMerkleProof(tokenInput);
  console.log("checkWhiteListProof log:", checkWhiteListProof);

  if (checkWhiteListProof.length > 0) {
    console.log(`Token at address ${tokenInput} is in the whitelist.`);
  } else {
    console.log(`Token at address ${tokenInput} is NOT in the whitelist.`);
  }

  return checkWhiteListProof;
}
