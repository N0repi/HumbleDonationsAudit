// mint_CreateProject.js

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xc0D69FE23f5B83EcFBC5D0A5025f780170BeB529";

  const recieverAddress = "0xf7ABBCaa52e051d10215414Dd694451Af4bF9111";

  const HumbleDonations = await hre.ethers.getContractAt(
    "HumbleDonations",
    contractAddress
  );

  const read_mintRate = await HumbleDonations.get_mintRate();
  const uri = ""; /*
  This is frontend logic that isn't important to the contract. 
  Regardless of what you pass as `uri`, the minted tokenId can be viewed from the frontend https://www.humbledonations.com/donate
  if minted with contradAddress "0xc0D69FE23f5B83EcFBC5D0A5025f780170BeB529"

  Essentially, formatting the uri as a JSON with the following fields will create a dynamic route on the frontend. 
  An example uri below:
  {"title":"Example Title","body":"Example Description","tag":["DeFi"],"website":"https://humbledonations.com","twitter":"","discord":"","youtube":"","twitch":"","reel":"","github":"N0repi"}

  Is being rendered on https://www.humbledonations.com/projects/Example%20Title
  */
  const projectTitle = "projectTestID2"; // any name that has not been previously used will suffice

  const mintTokens = await HumbleDonations.safeMint(
    recieverAddress,
    uri,
    projectTitle,
    {
      value: read_mintRate,
    }
  );

  console.log(
    //`Transaction Hash: https://sepolia.etherscan.io/tx/${mintTokens.hash}`,
    `Transaction Hash: https://sepolia.etherscan.io/tx/${mintTokens.hash}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// await humbleDonations.waitForDeployment();

// const deploymentAddress = await humbleDonations.getAddress();

// console.log(
//   `Deployed to https://sepolia.etherscan.io/address/${deploymentAddress}`
// );
// }
