// slippage.js

import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();
import { Token } from "@uniswap/sdk-core";
import { computePoolAddress, FeeAmount } from "@uniswap/v3-sdk";
import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json" assert { type: "json" };
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json" assert { type: "json" };
import {
  toReadableAmount,
  fromReadableAmount,
  WETH_TOKEN,
  HDT_TOKEN,
} from "./libs/conversion.mjs";

const API_URL = process.env.API_URL_SEPOLIA2;
const privateKey = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

export default async function getAmountOutMinimum(
  tokenIn,
  amountIn,
  slippageTolerance
) {
  const tokenPass = new Token(
    tokenIn.chainId,
    tokenIn.address,
    tokenIn.decimals,
    tokenIn.symbol,
    tokenIn.name
  );

  const QUOTER_CONTRACT_ADDRESS = "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3";

  const CurrentConfig = {
    pool: {
      token0: WETH_TOKEN,
      token1: HDT_TOKEN,
      fee: FeeAmount.MEDIUM,
    },
  };

  const exactInputConfig = {
    rpc: {
      mainnet: provider,
    },
    tokens: {
      in: WETH_TOKEN,
      amountIn: amountIn,
      out: HDT_TOKEN,
      poolFee: FeeAmount.MEDIUM,
    },
  };

  const currentPoolAddress = computePoolAddress({
    factoryAddress: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    tokenA: CurrentConfig.pool.token0,
    tokenB: CurrentConfig.pool.token1,
    fee: CurrentConfig.pool.fee,
  });
  // const currentPoolAddress = "0x326fDb8fB3D796124F9D7a3F8F0758D510823Aac";
  console.log("currentPoolAddress", currentPoolAddress);

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3Pool.abi,
    provider
  );

  // ******
  // ******Chaging/ token0 to token1 and token1 to token 0 results in a accurate quote******
  // ******
  const [token0, token1, fee] = await Promise.all([
    poolContract.token1(),
    poolContract.token0(),
    poolContract.fee(),
  ]);

  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    provider
  );

  try {
    const params = {
      tokenIn: token0,
      tokenOut: token1,
      fee: fee,
      amountIn: fromReadableAmount(amountIn, 18).toString(),
      sqrtPriceLimitX96: 0,
    };

    // v2
    const quotedAmountV2 =
      await quoterContract.quoteExactInputSingle.staticCall(params);
    console.log("Slippage value check:", slippageTolerance);
    console.log("----Quote----");
    console.log("quotedAmountV2:", quotedAmountV2.amountOut);

    const quotedAmountV2format = toReadableAmount(
      quotedAmountV2.amountOut,
      exactInputConfig.tokens.in.decimals
    );
    console.log("quotedAmountV2 format:", quotedAmountV2format);
    console.log("----Slippage----");
    const amountOutMinimum =
      (quotedAmountV2format * (10000 - slippageTolerance * 10000)) / 10000;

    console.log("amountOutMinimum", amountOutMinimum);
    console.log("amountOutMinimum Str - ", amountOutMinimum.toString());

    return amountOutMinimum;
    // return quotedAmountV2format;
  } catch (error) {
    console.error("Error getting quote:", error);
    throw error;
  }
}
