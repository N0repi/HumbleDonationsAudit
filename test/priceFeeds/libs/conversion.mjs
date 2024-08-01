// conversionImproveNotation.mjs

// helper file for queryDEX.mjs

import { ethers } from "ethers";

const READABLE_FORM_LEN = 18; // *** Adjust `READABLE_FORM_LEN` value in `conversions.*` to increase notation/# of digits returned

export function fromReadableAmount(amount, decimals) {
  return ethers.parseUnits(amount.toString(), decimals);
}

export function toReadableAmount(rawAmount, decimals) {
  return ethers.formatUnits(rawAmount, decimals).slice(0, READABLE_FORM_LEN);
}

import { Token } from "@uniswap/sdk-core";

export const WETH_TOKEN = new Token(
  11155111,
  "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  18,
  "WETH",
  "Wrapped Ether"
);

export const UNI_TOKEN = new Token(
  11155111,
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  18,
  "UNI",
  "Uniswap"
);

export const HDT_TOKEN = new Token(
  11155111,
  "0x9707be4129f68b767af550fe1c631bf1779623cb",
  18,
  "HDT",
  "Humble Donations Token"
);

export const USDT_TOKEN = new Token(
  11155111,
  "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
  6,
  "USDT",
  "Tether USD"
);
