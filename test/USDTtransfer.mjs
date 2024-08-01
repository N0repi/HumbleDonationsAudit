import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import USDT_mainnet from "./tokenABI/USDT_mainnet.json" assert { type: "json" };

const USDT_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0"; // Sepolia | 6 decimals
const WALLET_ADDRESS = "0xf7ABBCaa52e051d10215414Dd694451Af4bF9111"; // Your wallet address
const WALLET_SECRET = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL_SEPOLIA; // Sepolia
const CONTRACT_ADDRESS = "0xbA98b648513b31ADC84F07Bb1eF058EE87965707"; // Your contract address

const provider = new ethers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(WALLET_SECRET, provider);
const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_mainnet, signer);

async function testUSDTTransfer() {
  try {
    console.log("START");

    const amountIn = ethers.parseUnits("0.00001", 6); // Small test amount

    // Check initial allowance
    const initialAllowance = await usdtContract.allowance(
      WALLET_ADDRESS,
      CONTRACT_ADDRESS
    );
    console.log(`Initial Allowance: ${initialAllowance.toString()}`);

    // APPROVAL
    const approvalTx = await usdtContract.approve(CONTRACT_ADDRESS, amountIn);
    await approvalTx.wait();
    console.log(
      `Approval successful: https://sepolia.etherscan.io/tx/${approvalTx.hash}`
    );

    // Check updated allowance
    const updatedAllowance = await usdtContract.allowance(
      WALLET_ADDRESS,
      CONTRACT_ADDRESS
    );
    console.log(`Updated Allowance: ${updatedAllowance.toString()}`);

    // Direct Transfer to the contract
    const transferTx = await usdtContract.transfer(CONTRACT_ADDRESS, amountIn);
    const transferReceipt = await transferTx.wait();
    console.log(
      `Transfer successful: https://sepolia.etherscan.io/tx/${transferTx.hash}`
    );
  } catch (error) {
    console.log("encountered payment error", error);
    console.error("Transaction data:", error.transaction);
    console.error("Transaction receipt:", error.receipt);
  }
}

testUSDTTransfer();
