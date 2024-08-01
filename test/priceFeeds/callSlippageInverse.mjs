import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();
import {
  toReadableAmount,
  fromReadableAmount,
  WETH_TOKEN,
  HDT_TOKEN,
} from "./libs/conversion.mjs";
import getAmountOutMinimum from "./slippageInverse.mjs";

const API_URL = process.env.API_URL_SEPOLIA2;
const privateKey = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const HDT = "0x9707be4129f68b767af550fe1c631bf1779623cb";
const WETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";

/*
The swap functions on HumbleDonations.sol are internal, therefore a default slippage is passed
to `donate` which internally passes slippage to the swap functions
*/

async function callSlippage() {
  const slippageTolerance = 0.04; // 0.4%
  const tokenIn = WETH_TOKEN;
  const amountIn = "0.000761203"; // amountIn as string
  console.log(`amountIn: ${amountIn} WETH`);

  const tokenInHdt = await getAmountOutMinimum(
    tokenIn,
    amountIn,
    slippageTolerance
  );
  console.log("----Call Slippage----");
  const amountOutMinimumStr = tokenInHdt.toString();
  console.log("tokenInHdt:", amountOutMinimumStr);
  const amountOutMinimumFullPrecision = tokenInHdt.toFixed(25);
  console.log("amountOutMinimumFullPrecision:", amountOutMinimumFullPrecision);
  const sliced = amountOutMinimumFullPrecision.slice(0, 18);

  console.log("sliced:", sliced);
  // console.log("callSlipInverse", tokenInHdt);
}

callSlippage();
