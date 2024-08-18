// genMerkleWithHDT.mjs

import { ethers, AbiCoder } from "ethers";

import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { GET_AIRDROP } from "./utils/NOC/graphReactNOC.mjs";
import client from "./utils/NOC/urqlClientNOC.mjs";

/*
-----
Compute index for:
  1. address of owner of projects - 1000 HDT
  2. address of project owner number of donations received in ERC-20 tokens excluding HDT - ( number of donations * 10 HDT)
  3. donors of donations made in ERC-20 tokens excluding HDT - 100 HDT
  4. donors of a donation made in 150+ HDT - 150 HDT
-----
*/

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

    // console.log("Subgraph data:", data);

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
    // Step 1: Add the owner address as a leaf
    const ownerAmount = ethers.parseUnits("1000", 18);
    const ownerLeaf = keccak256(
      abiEncodePacked(["address", "uint256"], [project.owner, ownerAmount])
    );
    leaves.push(ownerLeaf);

    // Step 2: Calculate the number of valid donations and add as a leaf
    const validDonations = project.donations.filter(
      (donation) => donation.erc20Token.toLowerCase() !== HDT.toLowerCase()
    );
    const numValidDonations = validDonations.length;
    const donationAmount = ethers.parseUnits(
      (numValidDonations * 10).toString(),
      18
    );
    const donationLeaf = keccak256(
      abiEncodePacked(["address", "uint256"], [project.owner, donationAmount])
    );
    leaves.push(donationLeaf);

    // Step 3: Add unique donors for valid donations as leaves
    const uniqueDonors = new Set();
    validDonations.forEach((donation) => {
      uniqueDonors.add(donation.donor.toLowerCase());
    });
    const donorAmount = ethers.parseUnits("100", 18);
    Array.from(uniqueDonors).forEach((donor) => {
      const donorLeaf = keccak256(
        abiEncodePacked(["address", "uint256"], [donor, donorAmount])
      );
      leaves.push(donorLeaf);
    });

    // Step 4: Add unique donors for HDT donations over 150 as leaves
    const hdtDonors = new Set();
    const highValueHDTDonations = project.donations.filter((donation) => {
      const amount = parseFloat(donation.amount);

      return (
        donation.erc20Token.toLowerCase() === HDT.toLowerCase() &&
        amount > MIN_AMOUNT_WEI
      );
    });

    const highValueAmount = ethers.parseUnits("150", 18);
    highValueHDTDonations.forEach((donation) => {
      const highValueLeaf = keccak256(
        abiEncodePacked(
          ["address", "uint256"],
          [donation.donor.toLowerCase(), highValueAmount]
        )
      );
      leaves.push(highValueLeaf);
    });
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = merkleTree.getRoot().toString("hex");
  console.log("Merkle Root:", root);

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

  // Step 1: Owner Proof
  const ownerAmount = ethers.parseUnits("1000", 18);
  const ownerLeaf = keccak256(
    abiEncodePacked(
      ["address", "uint256"],
      [connectedWalletAddress, ownerAmount]
    )
  );
  const ownerProof = merkleTree
    .getProof(ownerLeaf)
    .map((p) => p.data.toString("hex"));
  const isOwnerProofValid = merkleTree.verify(
    ownerProof,
    ownerLeaf,
    merkleTree.getRoot()
  );
  console.log("Owner Proof:", ownerProof);
  console.log("Is the owner proof valid?", isOwnerProofValid);

  // Step 2: Donation Proof
  const validDonations = project.donations.filter(
    (donation) => donation.erc20Token.toLowerCase() !== HDT.toLowerCase()
  );
  const numValidDonations = validDonations.length;
  const donationAmount = ethers.parseUnits(
    (numValidDonations * 10).toString(),
    18
  );
  const donationLeaf = keccak256(
    abiEncodePacked(["address", "uint256"], [project.owner, donationAmount])
  );
  const donationProof = merkleTree
    .getProof(donationLeaf)
    .map((p) => p.data.toString("hex"));
  const isDonationProofValid = merkleTree.verify(
    donationProof,
    donationLeaf,
    merkleTree.getRoot()
  );
  console.log("Donation Proof:", donationProof);
  console.log("Is the donation proof valid?", isDonationProofValid);

  // Step 3: Donor Proofs
  const donorProofs = [];
  const donorProofValidities = [];
  const uniqueDonors = new Set();
  validDonations.forEach((donation) => {
    uniqueDonors.add(donation.donor.toLowerCase());
  });
  const donorAmount = ethers.parseUnits("100", 18);
  Array.from(uniqueDonors).forEach((donor) => {
    const donorLeaf = keccak256(
      abiEncodePacked(["address", "uint256"], [donor, donorAmount])
    );
    const donorProof = merkleTree
      .getProof(donorLeaf)
      .map((p) => p.data.toString("hex"));
    const isDonorProofValid = merkleTree.verify(
      donorProof,
      donorLeaf,
      merkleTree.getRoot()
    );
    console.log(`Donor Proof for ${donor}:`, donorProof);
    console.log(`Is the donor proof valid for ${donor}?`, isDonorProofValid);

    donorProofs.push({ donor, proof: donorProof, amount: donorAmount });
    donorProofValidities.push({ donor, isValid: isDonorProofValid });
  });

  // Step 4: High-Value Donor Proofs
  const highValueProofs = [];
  const highValueProofValidities = [];
  const highValueHDTDonations = project.donations.filter((donation) => {
    const amount = parseFloat(donation.amount);
    return (
      donation.erc20Token.toLowerCase() === HDT.toLowerCase() &&
      amount > MIN_AMOUNT_WEI
    );
  });

  const highValueAmount = ethers.parseUnits("150", 18);
  highValueHDTDonations.forEach((donation) => {
    const highValueLeaf = keccak256(
      abiEncodePacked(
        ["address", "uint256"],
        [donation.donor.toLowerCase(), highValueAmount]
      )
    );
    const highValueProof = merkleTree
      .getProof(highValueLeaf)
      .map((p) => p.data.toString("hex"));
    const isHighValueProofValid = merkleTree.verify(
      highValueProof,
      highValueLeaf,
      merkleTree.getRoot()
    );
    console.log(
      `High-Value Donor Proof for ${donation.donor}:`,
      highValueProof
    );
    console.log(
      `Is the high-value donor proof valid for ${donation.donor}?`,
      isHighValueProofValid
    );

    highValueProofs.push({
      donor: donation.donor,
      proof: highValueProof,
      amount: highValueAmount,
    });
    highValueProofValidities.push({
      donor: donation.donor,
      isValid: isHighValueProofValid,
    });
  });

  return {
    ownerProof,
    isOwnerProofValid,
    donationProof,
    isDonationProofValid,
    donorProofs,
    donorProofValidities,
    highValueProofs,
    highValueProofValidities,
  };
}

// Example usage
generateProof("0", "0xF0f472619cCE62B7d54dF3Bf17c4335EF311F1A5").then(
  ({
    ownerProof,
    isOwnerProofValid,
    donationProof,
    isDonationProofValid,
    donorProofs,
    donorProofValidities,
    highValueProofs,
    highValueProofValidities,
  }) => {
    console.log("Owner Proof:", ownerProof);
    console.log("Is the owner proof valid?", isOwnerProofValid);
    console.log("Donation Proof:", donationProof);
    console.log("Is the donation proof valid?", isDonationProofValid);
    console.log("Donor Proofs:", donorProofs);
    console.log("Donor Proof Validities:", donorProofValidities);
    console.log("High Value Proofs:", highValueProofs);
    console.log("High Value Proof Validities:", highValueProofValidities);
  }

  // if (isOwnerProofValid == true) {
  //   HDTamount = 1000}
);
