// merkle.mjs

import tokenListJson from "./myTokenList.json" assert { type: "json" };
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const myTokenList = tokenListJson.myTokenList;
// console.log(myTokenList);

async function computeMerkleRoot() {
  // Hash the whitelist entries
  const leaves = myTokenList.map((token) => keccak256(token.address));
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = merkleTree.getHexRoot();
  console.log("Merkle Root:", root);

  // Generate a proof for a specific address
  const leaf = keccak256("0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0");
  const proof = merkleTree.getHexProof(leaf);
  // console.log("Proof:", proof);

  return root;
}

// * COMMENTED OUT FOR OUTPUT NEATNESS IN `../scripts/setGet/setEssentials.mjs`
// **
// Function to get token details by address | Testing token address - inessential function
// function getTokenByAddress(address) {
//   return myTokenList.find((token) => token.address === address);
// }

// // Example usage
// const UNIaddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"; // example
// const tokenDetails = getTokenByAddress(UNIaddress);
// console.log("Token Details:", tokenDetails);
// **
// * COMMENTED OUT FOR OUTPUT NEATNESS IN `../scripts/setGet/setEssentials.mjs`
async function callCompute() {
  const merkleRoot = await computeMerkleRoot();
  return merkleRoot;
}

export { callCompute };
