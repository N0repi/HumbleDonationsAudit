// checkProofOnChain.mjs

import dotenv from "dotenv";
dotenv.config();
import { ethers, AbiCoder } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

import AirdropHDT from "../../artifacts/contracts/airdrop/AirdropHDT.sol/AirdropHDT.json" assert { type: "json" };
import snapshot from "./snapshot/snapshot.json" assert { type: "json" };

const contractAddress = "0xed24e9AF4caaAea1fF721C4274635821C2d76651";
const { abi } = AirdropHDT;

const privateKey = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL_SEPOLIA;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const HDT = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";
const MIN_AMOUNT = 150;
const MIN_AMOUNT_WEI = ethers.parseUnits(MIN_AMOUNT.toString(), 18);

function abiEncodePacked(types, values) {
  const abiCoder = new AbiCoder();
  return abiCoder.encode(types, values);
}

async function generateMerkleTree() {
  const projects = snapshot;

  if (!projects) {
    throw new Error("No data available to generate Merkle Tree");
  }

  const leaves = projects.map((project) => {
    let totalAmount = ethers.parseUnits("1000", 18);

    const validDonations = project.donations.filter(
      (donation) => donation.erc20Token.toLowerCase() !== HDT.toLowerCase()
    );
    totalAmount += ethers.parseUnits(
      (validDonations.length * 10).toString(),
      18
    );

    const uniqueDonors = new Set(
      validDonations.map((donation) => donation.donor.toLowerCase())
    );
    totalAmount += ethers.parseUnits("100", 18) * BigInt(uniqueDonors.size);

    const highValueHDTDonations = project.donations.filter((donation) => {
      const amount = ethers.parseUnits(donation.amount, 18);
      return (
        donation.erc20Token.toLowerCase() === HDT.toLowerCase() &&
        amount > MIN_AMOUNT_WEI
      );
    });
    totalAmount +=
      ethers.parseUnits("150", 18) * BigInt(highValueHDTDonations.length);

    const leaf = keccak256(
      abiEncodePacked(["address", "uint256"], [project.owner, totalAmount])
    );
    return leaf;
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return { merkleTree, projects };
}

async function generateProof(projectId, connectedWalletAddress) {
  const { merkleTree, projects } = await generateMerkleTree();

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }

  let totalAmount = ethers.parseUnits("1000", 18);

  const validDonations = project.donations.filter(
    (donation) => donation.erc20Token.toLowerCase() !== HDT.toLowerCase()
  );
  totalAmount += ethers.parseUnits((validDonations.length * 10).toString(), 18);

  const uniqueDonors = new Set(
    validDonations.map((donation) => donation.donor.toLowerCase())
  );
  totalAmount += ethers.parseUnits("100", 18) * BigInt(uniqueDonors.size);

  const highValueHDTDonations = project.donations.filter((donation) => {
    const amount = ethers.parseUnits(donation.amount, 18);
    return (
      donation.erc20Token.toLowerCase() === HDT.toLowerCase() &&
      amount > MIN_AMOUNT_WEI
    );
  });
  totalAmount +=
    ethers.parseUnits("150", 18) * BigInt(highValueHDTDonations.length);

  const leaf = keccak256(
    abiEncodePacked(
      ["address", "uint256"],
      [connectedWalletAddress, totalAmount]
    )
  );
  const proof = merkleTree
    .getProof(leaf)
    .map((p) => "0x" + p.data.toString("hex"));
  const isValid = merkleTree.verify(proof, leaf, merkleTree.getRoot());

  if (!isValid) {
    throw new Error("Generated proof is not valid.");
  }

  console.log("Proof:", proof);
  console.log("Total Amount:", totalAmount.toString());
  return { totalAmount, proof };
}

async function callContract() {
  try {
    const { totalAmount, proof } = await generateProof("21", wallet.address);

    console.log("proof:", proof);
    console.log("totalAmount:", totalAmount.toString());

    const contract = new ethers.Contract(contractAddress, abi, wallet);
    const claimTokens = await contract.claimTokens(totalAmount, proof, {
      gasLimit: "100000",
    });
    await claimTokens.wait();

    console.log("Transaction successful!");
  } catch (error) {
    console.error("Transaction failed:", error.message);
  }
}

callContract();
