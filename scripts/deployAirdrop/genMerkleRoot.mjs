import { ethers, AbiCoder } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import snapshot from "./snapshot/snapshot.json" assert { type: "json" };

const HDT = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";
const MIN_AMOUNT = 150;
const MIN_AMOUNT_WEI = ethers.parseUnits(MIN_AMOUNT.toString(), 18).toString();

console.log("MIN_AMOUNT in wei:", MIN_AMOUNT_WEI);

function abiEncodePacked(types, values) {
  const abiCoder = new AbiCoder();
  return ethers.keccak256(abiCoder.encode(types, values));
}

export default async function generateMerkleTree() {
  const projects = snapshot;

  if (!projects) {
    console.error("No data available to generate Merkle Tree");
    return;
  }

  const leaves = [];

  projects.forEach((project) => {
    let totalAmount = ethers.parseUnits("1000", 18); // Owner base amount

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
    leaves.push(leaf);

    // Log the leaf and the total amount
    console.log(`Leaf for ${project.owner}: ${leaf.toString("hex")}`);
    console.log(`Total amount for leaf: ${totalAmount.toString()}`);
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = merkleTree.getRoot().toString("hex");
  const root32 = "0x" + root; // ensure Solidity handles the root as a hexadecimal

  console.log("Merkle Root:", root);
  console.log("32-byte root: ", root32);

  return root32;
}

generateMerkleTree();
