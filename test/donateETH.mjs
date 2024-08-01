// donateETH.mjs

import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";

import HumbleDonations from "../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };

const { abi: HumbleDonationsAbi } = HumbleDonations;

const WALLET_ADDRESS = "0xF0f472619cCE62B7d54dF3Bf17c4335EF311F1A5"; // Your wallet address
const WALLET_SECRET = process.env.PRIVATE_KEY2;
const API_URL = process.env.API_URL_SEPOLIA; // Sepolia
const provider = new ethers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(WALLET_SECRET, provider);

// -------- Change For Testing --------
const contractAddress = "0xc0D69FE23f5B83EcFBC5D0A5025f780170BeB529";

const amountIn = ethers.parseUnits("0.0001", 18);

const tokenId = 1;
const ownerAddressOfTokenId = "0xf7ABBCaa52e051d10215414Dd694451Af4bF9111"; // AKA as the recipient of the donation
const slippageWETH = "0";
const slippageHDT = "0";
// -------- Change For Testing --------

// HumbleDonations Contract Instance
const HumbleDonationsInstance = new ethers.Contract(
  contractAddress,
  HumbleDonationsAbi,
  signer
);

async function Payable() {
  try {
    console.log("START");

    const taxPercentage = await HumbleDonationsInstance.getPercentage();
    const taxDecimal = taxPercentage.toString() / 10;
    console.log("Tax Percentage:", taxDecimal.toString(), "%");

    // Initial Balances
    let ethBalance = await provider.getBalance(WALLET_ADDRESS);
    let ethBalanceRecipient = await provider.getBalance(ownerAddressOfTokenId);

    console.log("Initial balances captured.");

    const initEthBalance = ethers.formatUnits(ethBalance, 18);
    const initEthBalanceRecipient = ethers.formatUnits(ethBalanceRecipient, 18);

    console.log("sending");
    // CONFIRMATION
    const payTokenOwnerTx = await HumbleDonationsInstance.donate(
      tokenId,
      "0x0000000000000000000000000000000000000000",
      amountIn,
      slippageWETH,
      slippageHDT,
      [],
      {
        // gasLimit: "1000000",
        value: amountIn,
      }
    );
    const paymentReceipt = await payTokenOwnerTx.wait();
    console.log(
      `Confirmation successful: https://sepolia.etherscan.io/tx/${payTokenOwnerTx.hash}`
    );

    // Calculate gas fee
    const gasUsed = paymentReceipt.gasUsed;
    const gasFeeInEth = ethers.formatUnits(gasUsed, 18);
    console.log("gasUsed formatted", ethers.formatUnits(gasUsed, 18));

    // Final Balances
    ethBalance = await provider.getBalance(WALLET_ADDRESS);
    ethBalanceRecipient = await provider.getBalance(ownerAddressOfTokenId);

    console.log("Final balances captured.");

    const finalEthBalance = ethers.formatUnits(ethBalance, 18);
    const finalEthBalanceRecipient = ethers.formatUnits(
      ethBalanceRecipient,
      18
    );
    // Net Gain Calculation for Wallet
    const ethNet = finalEthBalance - initEthBalance - gasFeeInEth;

    // Net Gain Calculation for Recipient
    const ethNetRecipient = finalEthBalanceRecipient - initEthBalanceRecipient;

    console.log("---------------------------- NET");
    console.log(" ----- Wallet -----");
    console.log(`Net ETH: ${ethNet}`);

    console.log(" ----- Recipient -----");
    console.log(`Net ETH Recipient: ${ethNetRecipient}`);

    // * UNCOMMENT TO LOG THE FULL CONFIRMATION TRANSACTION RECIEPT *
    // console.log("Confirmation Transaction Receipt:", paymentReceipt);

    // Calculate the difference and check if it matches the tax
    const ethDifference = ethNet - ethNetRecipient;
    const actualTax = ethDifference;
    const expectedTax = (ethNet * taxDecimal) / 100; // Convert taxDecimal to percentage
    const tolerance = 0.001; // *Allowable difference due to external factors such as pool fees*

    const isTaxCorrect = Math.abs(actualTax - expectedTax) <= tolerance;

    console.log(`Actual Tax Applied: ${actualTax}`);
    console.log(`Expected Tax: ${expectedTax}`);
    console.log(`Is Tax Correct: ${isTaxCorrect}`);

    if (!isTaxCorrect) {
      console.log("Transaction tax does not match the expected tax.");
    } else {
      console.log("Transaction tax matches the expected tax.");
    }
  } catch (error) {
    console.log("encountered payment error", error);
  }
}

Payable();
