// fetchUSDT-WETH.mjs

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
  USDT_TOKEN,
  WETH_TOKEN,
} from "./libs/conversion.mjs";

const name1 = "Tether USD";
const symbol1 = "USDT";
const decimals1 = 6;
const address1 = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";

const USDTtoken = {
  chainId: 11155111,
  address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
  decimals: 6,
  symbol: "USDT",
  name: "Tether USD",
};

const API_URL = process.env.API_URL_SEPOLIA2;
const privateKey = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

async function getAmountOutMinimum() {
  const tokenIn = USDTtoken;
  const tokenPass = new Token(
    tokenIn.chainId,
    tokenIn.address,
    tokenIn.decimals,
    tokenIn.symbol,
    tokenIn.name
  );

  const CurrentConfig = {
    pool: {
      token0: tokenPass,
      token1: WETH_TOKEN,
      fee: FeeAmount.MEDIUM,
    },
  };

  const currentPoolAddress = computePoolAddress({
    factoryAddress: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    tokenA: CurrentConfig.pool.token0,
    tokenB: CurrentConfig.pool.token1,
    fee: CurrentConfig.pool.fee,
  });
  console.log("currentPoolAddress", currentPoolAddress);
  console.log(
    "----Pool Address USDT-WETH: 0x46bb6bb1b27069C652AA40ddbF47854b1C426428----"
  );
}

getAmountOutMinimum();
