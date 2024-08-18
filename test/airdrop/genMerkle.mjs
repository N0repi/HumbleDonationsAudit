// genMerkle.mjs

import { ethers } from "ethers";

import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { GET_AIRDROP } from "./utils/NOC/graphReactNOC.mjs";
import client from "./utils/NOC/urqlClientNOC.mjs";

/*
-----
Computer index for:
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

    console.log("Subgraph data:", data);

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
    const ownerLeaf = keccak256(project.id + project.owner);
    leaves.push(ownerLeaf);

    // Step 2: Calculate the number of valid donations and add as a leaf
    const validDonations = project.donations.filter(
      (donation) => donation.erc20Token.toLowerCase() !== HDT.toLowerCase()
    );
    const numValidDonations = validDonations.length;
    leaves.push(keccak256(project.id + numValidDonations.toString()));

    // Step 3: Add unique donors for valid donations as leaves
    const uniqueDonors = new Set();
    validDonations.forEach((donation) => {
      uniqueDonors.add(donation.donor.toLowerCase());
    });
    Array.from(uniqueDonors).forEach((donor) => {
      leaves.push(keccak256(project.id + donor));
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

    highValueHDTDonations.forEach((donation) => {
      hdtDonors.add(donation.donor.toLowerCase());
    });

    Array.from(hdtDonors).forEach((donor) => {
      leaves.push(keccak256(project.id + donor));
    });

    // Generate Merkle Proof for a specific leaf (e.g., ownerLeaf)
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const proof = merkleTree.getProof(ownerLeaf);
    console.log("Merkle Proof for Owner:", proof);

    // Verify the leaf against the Merkle root
    const isValid = merkleTree.verify(proof, ownerLeaf, merkleTree.getRoot());
    console.log("Is the owner leaf valid?", isValid);
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = merkleTree.getRoot().toString("hex");

  console.log("Merkle Root:", root);
}

generateMerkleTree();
/*
Of note:
    Merkle root hash does not change if there are additional exlcuded (HDT) donations made.
*/

/*
----- 8/13/24 Output 1:55 AM -----
Subgraph data: {
  projects: [
    {
      id: '0',
      owner: '0xf0f472619cce62b7d54df3bf17c4335ef311f1a5',
      createdAt: '1722498648',
      donations: [Array],
      __typename: 'Project'
    },
    {
      id: '2',
      owner: '0x9ffb39e46ba9d957957808967fd59ce3b62cd304',
      createdAt: '1722562152',
      donations: [Array],
      __typename: 'Project'
    },
    {
      id: '21',
      owner: '0xf7abbcaa52e051d10215414dd694451af4bf9111',
      createdAt: '1723420920',
      donations: [Array],
      __typename: 'Project'
    },
    {
      id: '3',
      owner: '0x88b944e7e3d495b88caa62fb0158f697c9a1561d',
      createdAt: '1722562212',
      donations: [Array],
      __typename: 'Project'
    },
    {
      id: '4',
      owner: '0x68b43a1c7dfc773ac84c37a62bfa76e3055b7074',
      createdAt: '1722562296',
      donations: [Array],
      __typename: 'Project'
    },
    {
      id: '5',
      owner: '0xfac8c2b6e70a67a3b133f4885fbd6f46cb865753',
      createdAt: '1722562488',
      donations: [Array],
      __typename: 'Project'
    }
  ]
}
Project ID: 0, Number of Valid Donations: 4
Project ID: 2, Number of Valid Donations: 1
Project ID: 21, Number of Valid Donations: 0
Project ID: 3, Number of Valid Donations: 1
Project ID: 4, Number of Valid Donations: 1
Project ID: 5, Number of Valid Donations: 1
Merkle Root: 4c9488d0615d51341ceffc4f5d2df97f4d59b9c9984a57fc2d24371b60507958
*/
