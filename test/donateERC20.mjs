// donateERC20.mjs

import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";

import erc20Abi from "./tokenABI/erc20Abi.json" assert { type: "json" };
import HumbleDonations from "../artifacts/contracts/HumbleDonations.sol/HumbleDonations.json" assert { type: "json" };

const { abi: HumbleDonationsAbi } = HumbleDonations;

const WETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Sepolia
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // Sepolia
const HDT_ADDRESS = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb"; // Sepolia
const USDC_ADDRESS = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"; // ** Goerli  | 6 decimals

const WALLET_ADDRESS = "0xF0f472619cCE62B7d54dF3Bf17c4335EF311F1A5"; // Your wallet address
const WALLET_SECRET = process.env.PRIVATE_KEY2;
const API_URL = process.env.API_URL_SEPOLIA; // Sepolia
const provider = new ethers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(WALLET_SECRET, provider);

const wethContract = new ethers.Contract(WETH_ADDRESS, erc20Abi, signer);
const uniContract = new ethers.Contract(UNI_ADDRESS, erc20Abi, signer);
const hdtContract = new ethers.Contract(HDT_ADDRESS, erc20Abi, signer);
const usdcContract = new ethers.Contract(USDC_ADDRESS, erc20Abi, signer);

// -------- Change For Testing --------
const contractAddress = "0xB9fe62Fbd99B3A57699B4f10b246e69761D9FEB4";

const tokenAddress = WETH_ADDRESS;
const amountIn = ethers.parseUnits("0.0001", 18);

const tokenId = 3;
const ownerAddressOfTokenId = "0xf7ABBCaa52e051d10215414Dd694451Af4bF9111"; // AKA as the recipient of the donation
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
    let wethBalance = await wethContract.balanceOf(WALLET_ADDRESS);
    let hdtBalance = await hdtContract.balanceOf(WALLET_ADDRESS);
    let uniBalance = await uniContract.balanceOf(WALLET_ADDRESS);
    let ethBalanceRecipient = await provider.getBalance(ownerAddressOfTokenId);
    let wethBalanceRecipient = await wethContract.balanceOf(
      ownerAddressOfTokenId
    );
    let uniBalanceRecipient = await uniContract.balanceOf(
      ownerAddressOfTokenId
    );
    let hdtBalanceRecipient = await hdtContract.balanceOf(
      ownerAddressOfTokenId
    );

    console.log("Initial balances captured.");

    const initEthBalance = ethers.formatUnits(ethBalance, 18);
    const initWethBalance = ethers.formatUnits(wethBalance, 18);
    const initUniBalance = ethers.formatUnits(uniBalance, 18);
    const initHdtBalance = ethers.formatUnits(hdtBalance, 18);

    const initEthBalanceRecipient = ethers.formatUnits(ethBalanceRecipient, 18);
    const initWethBalanceRecipient = ethers.formatUnits(
      wethBalanceRecipient,
      18
    );
    const initUniBalanceRecipient = ethers.formatUnits(uniBalanceRecipient, 18);
    const initHdtBalanceRecipient = ethers.formatUnits(hdtBalanceRecipient, 18);

    const erc20Contract = new ethers.Contract(tokenAddress, erc20Abi, signer);

    // APPROVAL
    const approvalTx = await erc20Contract.approve(contractAddress, amountIn);
    await approvalTx.wait();
    console.log(
      `Approval successful: https://sepolia.etherscan.io/tx/${approvalTx.hash}`
    );

    console.log("sending");
    // CONFIRMATION
    const payTokenOwnerTx = await HumbleDonationsInstance.donate(
      tokenId,
      tokenAddress,
      amountIn,
      { gasLimit: "1000000" }
    );
    const paymentReceipt = await payTokenOwnerTx.wait();
    console.log(
      `Confirmation successful: https://sepolia.etherscan.io/tx/${payTokenOwnerTx.hash}`
    );

    // Final Balances
    ethBalance = await provider.getBalance(WALLET_ADDRESS);
    wethBalance = await wethContract.balanceOf(WALLET_ADDRESS);
    hdtBalance = await hdtContract.balanceOf(WALLET_ADDRESS);
    uniBalance = await uniContract.balanceOf(WALLET_ADDRESS);
    ethBalanceRecipient = await provider.getBalance(ownerAddressOfTokenId);
    wethBalanceRecipient = await wethContract.balanceOf(ownerAddressOfTokenId);
    uniBalanceRecipient = await uniContract.balanceOf(ownerAddressOfTokenId);
    hdtBalanceRecipient = await hdtContract.balanceOf(ownerAddressOfTokenId);

    console.log("Final balances captured.");

    const finalEthBalance = ethers.formatUnits(ethBalance, 18);
    const finalWethBalance = ethers.formatUnits(wethBalance, 18);
    const finalUniBalance = ethers.formatUnits(uniBalance, 18);
    const finalHdtBalance = ethers.formatUnits(hdtBalance, 18);

    const finalEthBalanceRecipient = ethers.formatUnits(
      ethBalanceRecipient,
      18
    );
    const finalWethBalanceRecipient = ethers.formatUnits(
      wethBalanceRecipient,
      18
    );
    const finalUniBalanceRecipient = ethers.formatUnits(
      uniBalanceRecipient,
      18
    );
    const finalHdtBalanceRecipient = ethers.formatUnits(
      hdtBalanceRecipient,
      18
    );

    // Net Gain Calculation for Wallet
    const ethNet = finalEthBalance - initEthBalance;
    const wethNet = finalWethBalance - initWethBalance;
    const uniNet = finalUniBalance - initUniBalance;
    const hdtNet = finalHdtBalance - initHdtBalance;

    // Net Gain Calculation for Recipient
    const ethNetRecipient = finalEthBalanceRecipient - initEthBalanceRecipient;
    const wethNetRecipient =
      finalWethBalanceRecipient - initWethBalanceRecipient;
    const uniNetRecipient = finalUniBalanceRecipient - initUniBalanceRecipient;
    const hdtNetRecipient = finalHdtBalanceRecipient - initHdtBalanceRecipient;

    console.log("---------------------------- NET");
    console.log(" ----- Wallet -----");
    console.log(`Net ETH: ${ethNet}`);
    console.log(`Net WETH: ${wethNet}`);
    console.log(`Net UNI: ${uniNet}`);
    console.log(`Net HDT: ${hdtNet}`);

    console.log(" ----- Recipient -----");
    console.log(`Net ETH Recipient: ${ethNetRecipient}`);
    console.log(`Net WETH Recipient: ${wethNetRecipient}`);
    console.log(`Net UNI Recipient: ${uniNetRecipient}`);
    console.log(`Net HDT Recipient: ${hdtNetRecipient}`);

    // * UNCOMMENT TO LOG THE FULL CONFIRMATION TRANSACTION RECIEPT *
    // console.log("Confirmation Transaction Receipt:", paymentReceipt);

    if (tokenAddress != HDT_ADDRESS) {
      // Calculate the difference and check if it matches the tax
      const wethDifference = wethNet - wethNetRecipient;
      const actualTax = wethDifference;
      const expectedTax = (wethNet * taxDecimal) / 100; // Convert taxDecimal to percentage
      const tolerance = 0.001; // Allowable difference due to external factors

      const isTaxCorrect = Math.abs(actualTax - expectedTax) <= tolerance;

      console.log(`Actual Tax Applied: ${actualTax}`);
      console.log(`Expected Tax: ${expectedTax}`);
      console.log(`Is Tax Correct: ${isTaxCorrect}`);

      if (!isTaxCorrect) {
        console.log("Transaction tax does not match the expected tax.");
      } else {
        console.log("Transaction tax matches the expected tax.");
      }
    } else {
      console.log("HDT is exempt from taxation :P");
    }
  } catch (error) {
    console.log("encountered payment error", error);
  }
}

Payable();
