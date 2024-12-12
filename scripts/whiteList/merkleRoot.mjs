// merkleRoot.mjs

import tokenListJson from "./tokenListNoDupes.json" assert { type: "json" };
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const myTokenList = tokenListJson.myTokenList;
// console.log(myTokenList);

const chainId = 11155111;
async function computeMerkleRoot() {
  // Map to select the correct token address based on chainId
  const leaves = myTokenList.map((token) => {
    const bridgeAddress =
      token.extensions?.bridgeInfo?.[chainId]?.tokenAddress || token.address;
    return keccak256(bridgeAddress.toLowerCase()); // Normalize to lowercase
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = merkleTree.getHexRoot();
  console.log("Generated Merkle Root:", root);

  const computeProof = computeMerkleProof();
  console.log("computeMerkleProof:", computeProof);

  return root;
}

async function computeMerkleProof() {
  const chainId = 11155111;
  const tokenInput = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";
  console.log("Token Input Address:", tokenInput);

  // Find the token object in the list
  const token = myTokenList.find(
    (t) =>
      t.address.toLowerCase() === tokenInput.toLowerCase() ||
      Object.values(t.extensions?.bridgeInfo || {}).some(
        (bridge) =>
          bridge.tokenAddress.toLowerCase() === tokenInput.toLowerCase()
      )
  );

  if (!token) {
    throw new Error(`Token with address ${tokenInput} not found in whitelist.`);
  }

  // Map to select the correct token address based on chainId
  const leaves = myTokenList.map((token) => {
    const bridgeAddress =
      token.extensions?.bridgeInfo?.[chainId]?.tokenAddress || token.address;
    return keccak256(bridgeAddress.toLowerCase()); // Normalize to lowercase
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = merkleTree.getHexRoot();
  console.log("Generated Merkle Root:", root);

  // Use the bridged token address for the leaf
  const leafAddress =
    token.extensions?.bridgeInfo?.[chainId]?.tokenAddress || token.address;
  const leaf = keccak256(leafAddress.toLowerCase());
  console.log("Generated Leaf for Token:", leaf.toString("hex"));

  // Generate proof
  const proof = merkleTree.getHexProof(leaf);
  console.log("Generated Proof:", proof);

  return proof;
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
