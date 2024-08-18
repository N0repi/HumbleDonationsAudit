// genMerkleWithHDT.mjs

import dotenv from "dotenv";
dotenv.config();
import { ethers, AbiCoder } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

import { GET_AIRDROP } from "./utils/NOC/graphReactNOC.mjs";
import client from "./utils/NOC/urqlClientNOC.mjs";
import AirdropHDT from "../../artifacts/contracts/airdrop/AirdropHDT.sol/AirdropHDT.json" assert { type: "json" };

/*
-----
Compute index for:
  1. address of owner of projects - 1000 HDT
  2. address of project owner number of donations received in ERC-20 tokens excluding HDT - ( number of donations * 10 HDT)
  3. donors of donations made in ERC-20 tokens excluding HDT - 100 HDT
  4. donors of a donation made in 150+ HDT - 150 HDT
-----
*/
const contractAddress = "0x8Ff6BBE32E20a54658fA16B008748EA5EeE76D48";
const { abi } = AirdropHDT;

const privateKey = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL_SEPOLIA;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);
console.log("wallet:", wallet);

const HDT = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";
const MIN_AMOUNT = 150;
const MIN_AMOUNT_WEI = ethers.parseUnits(MIN_AMOUNT.toString(), 18).toString();

console.log("MIN_AMOUNT in wei:", MIN_AMOUNT_WEI);

// Helper function to mimic Solidity's abi.encodePacked
function abiEncodePacked(types, values) {
  const abiCoder = new AbiCoder();
  return ethers.keccak256(abiCoder.encode(types, values));
}

async function getSubgraph() {
  try {
    const result = await client.query(GET_AIRDROP).toPromise();
    const { data, fetching, error } = result;

    if (fetching) {
      console.log("Fetching...");
    }

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    return data.projects;
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

async function generateMerkleTree() {
  const projects = await getSubgraph();

  if (!projects) {
    console.error("No data available to generate Merkle Tree");
    return;
  }

  const leaves = [];

  projects.forEach((project) => {
    let totalAmount = ethers.parseUnits("1000", 18); // Owner base amount

    // Calculate the number of valid donations
    const validDonations = project.donations.filter(
      (donation) => donation.erc20Token.toLowerCase() !== HDT.toLowerCase()
    );
    const numValidDonations = validDonations.length;
    const donationAmount = ethers.parseUnits(
      (numValidDonations * 10).toString(),
      18
    );
    totalAmount += donationAmount; // Add donation amount to total

    // Calculate donor amounts
    const uniqueDonors = new Set();
    validDonations.forEach((donation) => {
      uniqueDonors.add(donation.donor.toLowerCase());
    });
    totalAmount += ethers.parseUnits("100", 18) * BigInt(uniqueDonors.size);

    // Calculate high-value donations
    const highValueHDTDonations = project.donations.filter((donation) => {
      const amount = parseFloat(donation.amount);
      return (
        donation.erc20Token.toLowerCase() === HDT.toLowerCase() &&
        amount > MIN_AMOUNT_WEI
      );
    });
    totalAmount +=
      ethers.parseUnits("150", 18) * BigInt(highValueHDTDonations.length); // Use `+` operator with BigInt

    // Create a single leaf for the total amount
    const leaf = keccak256(
      abiEncodePacked(["address", "uint256"], [project.owner, totalAmount])
    );
    leaves.push(leaf);
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  return { merkleTree, projects };
}

async function generateProof(projectId, connectedWalletAddress) {
  const { merkleTree, projects } = await generateMerkleTree();

  // Find the project by ID
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }

  // Translate the connected wallet address to the project owner if needed
  if (project.owner.toLowerCase() !== connectedWalletAddress.toLowerCase()) {
    throw new Error(
      "The connected wallet address is not the owner of the project"
    );
  }

  // Calculate the total amount for the leaf
  let totalAmount = ethers.parseUnits("1000", 18); // Owner base amount

  // Calculate the number of valid donations
  const validDonations = project.donations.filter(
    (donation) => donation.erc20Token.toLowerCase() !== HDT.toLowerCase()
  );
  const numValidDonations = validDonations.length;
  totalAmount += ethers.parseUnits((numValidDonations * 10).toString(), 18);

  // Calculate donor amounts
  const uniqueDonors = new Set();
  validDonations.forEach((donation) => {
    uniqueDonors.add(donation.donor.toLowerCase());
  });
  totalAmount += ethers.parseUnits("100", 18) * BigInt(uniqueDonors.size);

  // Calculate high-value donations
  const highValueHDTDonations = project.donations.filter((donation) => {
    const amount = parseFloat(donation.amount);
    return (
      donation.erc20Token.toLowerCase() === HDT.toLowerCase() &&
      amount > MIN_AMOUNT_WEI
    );
  });
  totalAmount +=
    ethers.parseUnits("150", 18) * BigInt(highValueHDTDonations.length); // Use `+` operator with BigInt

  // Generate the leaf and proof
  const leaf = keccak256(
    abiEncodePacked(
      ["address", "uint256"],
      [connectedWalletAddress, totalAmount]
    )
  );
  const proof = merkleTree.getProof(leaf).map((p) => p.data.toString("hex"));
  const isValid = merkleTree.verify(proof, leaf, merkleTree.getRoot());

  console.log("Proof:", proof);
  console.log("Is the proof valid?", isValid);
  console.log("Total Amount:", totalAmount.toString());

  return { totalAmount, proof };
}

async function callContract() {
  const { totalAmount, proof } = await generateProof(
    "0",
    "0xF0f472619cCE62B7d54dF3Bf17c4335EF311F1A5"
  );
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  const claimTokens = await contract.claimTokens(totalAmount, proof);
  await claimTokens.wait();
  console.log("Transaction Hash:", claimTokens.hash);
}

callContract();

// project ID     |     connected wallet address
generateProof("0", "0xF0f472619cCE62B7d54dF3Bf17c4335EF311F1A5").then(
  ({ totalAmount, proof }) => {
    console.log("Proof:", proof);
    console.log("Total Amount:", totalAmount.toString());
    const parsedTotalAmount = ethers.formatUnits(totalAmount);
    console.log("parsedTotalAmount:", parsedTotalAmount);
  }
);
