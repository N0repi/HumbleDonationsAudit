import dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import AirdropHDT from "../../artifacts/contracts/airdrop/AirdropHDT.sol/AirdropHDT.json" assert { type: "json" };
import snapshot from "./snapshot/snapshot.json" assert { type: "json" };

const contractAddress = "0xC8651777EB23A33E17e7A41C07dd73bA45Ff751b";
const { abi } = AirdropHDT;

const privateKey = process.env.PRIVATE_KEY;
const API_URL = process.env.API_URL_SEPOLIA;
const provider = new ethers.JsonRpcProvider(API_URL);
const wallet = new ethers.Wallet(privateKey, provider);

const HDT = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";
const MIN_AMOUNT = 150n;
const MIN_AMOUNT_WEI = ethers.parseUnits(MIN_AMOUNT.toString(), 18);

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
      (BigInt(validDonations.length) * 10n).toString(),
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

    const leaf = ethers.solidityPackedKeccak256(
      ["address", "uint256"],
      [project.owner, totalAmount]
    );

    console.log(`Leaf for ${project.owner}: ${leaf}`);
    console.log(`Total amount for leaf: ${totalAmount.toString()}`);
    return Buffer.from(leaf.slice(2), "hex"); // Convert to Buffer for MerkleTreejs
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = merkleTree.getRoot().toString("hex");
  const root32 = "0x" + root;

  console.log("Merkle Root:", root);
  console.log("32-byte root: ", root32);

  return { merkleTree, projects, root32 };
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
  totalAmount += ethers.parseUnits(
    (BigInt(validDonations.length) * 10n).toString(),
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

  const leaf = ethers.solidityPackedKeccak256(
    ["address", "uint256"],
    [connectedWalletAddress, totalAmount]
  );
  const leafBuffer = Buffer.from(leaf.slice(2), "hex");
  const proof = merkleTree
    .getProof(leafBuffer)
    .map((p) => "0x" + p.data.toString("hex"));
  const isValid = merkleTree.verify(
    proof.map((p) => Buffer.from(p.slice(2), "hex")),
    leafBuffer,
    merkleTree.getRoot()
  );

  if (!isValid) {
    console.error("Generated proof is not valid.");
  }

  console.log("Proof:", proof);
  console.log("Total Amount:", totalAmount.toString());
  return {
    totalAmount,
    proof,
    leaf: leafBuffer.toString("hex"),
    root: merkleTree.getRoot().toString("hex"),
  };
}

async function validateProof(leaf, proof, root) {
  let computedHash = Buffer.from(leaf, "hex");

  console.log(`Initial Leaf: ${computedHash.toString("hex")}`);

  for (let i = 0; i < proof.length; i++) {
    let proofElement = Buffer.from(proof[i].slice(2), "hex");
    console.log(`Proof Element [${i}]: ${proofElement.toString("hex")}`);

    if (computedHash < proofElement) {
      computedHash = keccak256(Buffer.concat([computedHash, proofElement]));
    } else {
      computedHash = keccak256(Buffer.concat([proofElement, computedHash]));
    }

    console.log(`Computed Hash [${i}]: ${computedHash.toString("hex")}`);
  }

  console.log(`Final Computed Hash: ${computedHash.toString("hex")}`);
  console.log(`Expected Root: ${root}`);

  return computedHash.toString("hex") === root;
}

async function callContract() {
  try {
    const { totalAmount, proof, leaf, root } = await generateProof(
      "21",
      wallet.address
    );

    console.log("proof:", proof);
    console.log("totalAmount:", totalAmount.toString());

    // Validate proof off-chain before sending the transaction
    const isValidProof = await validateProof(leaf, proof, root);
    console.log("Is the proof valid off-chain?", isValidProof);

    if (isValidProof) {
      const contract = new ethers.Contract(contractAddress, abi, wallet);
      const claimTokens = await contract.claimTokens(totalAmount, proof, {
        gasLimit: "100000",
      });
      await claimTokens.wait();
      console.log("Transaction successful!");
    } else {
      console.log("The proof is invalid. Transaction not sent.");
    }
  } catch (error) {
    console.error("Transaction failed:", error.message);
  }
}

callContract();
