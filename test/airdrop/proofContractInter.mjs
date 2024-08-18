// proofContractInter.mjs

import ethers from "ethers";

import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const contractAddress = "0x977428b2547A247848E2DD736B760c80da192b06";

const privateKey = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL_SEPOLIA;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);
console.log("wallet:", wallet);

const { abi } = Airdrop;

const contract = new ethers.Contract(contractAddress, abi, wallet);

function checkProof() {
  const proof = merkleTree.getProof(wallet);
  console.log("Merkle Proof for Owner:", proof);
}
