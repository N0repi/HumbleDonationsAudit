// addLiquidity.cjs

require("dotenv").config();
const { ethers } = require("hardhat");
const erc20 = require("./liquidityABI/erc20.json");
const {
  abi,
} = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

async function addLiquidity() {
  const positionManagerAddress = "0x3e3CAA2AE0B10757921b479F5db0F51475C2fE39";
  const positionManager = await ethers.getContractAt(
    abi,
    positionManagerAddress
  );

  const [signer] = await ethers.getSigners();

  const token0Address = "0x54c3F0c4AfA850Ce839994aE6512699d4dD9b075"; // WETH
  const token1Address = "0x37E2e52309FaA2b1e1a7AEc8502Be68886f33733"; // HDT
  // in wei
  const amount0 = ethers.parseUnits("2", 18);
  const amount1 = ethers.parseUnits("200", 18);

  // Approvals
  const token0 = new ethers.Contract(token0Address, erc20, signer);
  const token1 = new ethers.Contract(token1Address, erc20, signer);

  const token0approval = await token0.approve(positionManagerAddress, amount0);
  const token1approval = await token1.approve(positionManagerAddress, amount1);
  await token0approval.wait();
  await token1approval.wait();
  console.log(`token0 approval: ${token0approval.hash}`);
  console.log(`token1 approval: ${token1approval.hash}`);

  // Parameters for the liquidity position  |  Foregoing slippage calcs as it's inessential at this moment
  const params = {
    token0: token0Address, // Address of token0
    token1: token1Address, // Address of token1
    fee: 3000, // Fee tier
    tickLower: -887220, // Lower tick
    tickUpper: 887220, // Upper tick
    amount0Desired: amount0, // Amount of token0 to deposit
    amount1Desired: amount1, // Amount of token1 to deposit
    amount0Min: 1, // Minimum amount of token0 to deposit
    amount1Min: 1, // Minimum amount of token1 to deposit
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
  };

  // Add liquidity to the pool
  try {
    console.log("Attempting to mint...");
    const tx = await positionManager.mint(params, { gasLimit: "1000000" });
    console.log("Mint transaction sent.");
    await tx.wait();
    console.log("Liquidity added and position minted");
    console.log(`Transaction hash: ${tx.hash}`);
  } catch (error) {
    console.error("Static call failed:", error);
    if (error.error && error.error.message) {
      console.error("Revert reason:", error.error.message);
    }
  }

  // const tokenId = receipt.events.find((event) => event.event === "Transfer")
  //   .args.tokenId;

  // console.log(`Your NFT position tokenId is: ${tokenId.toString()}`);
}

addLiquidity();

/* 

Output re calling mint

token0 approval: 0x85ec6dd54018b85378ef85e622f07447efac8e12ec77e412dd05ea0f79b151f4
token1 approval: 0x180bae2d7093454909a470e1e656cfd052d77712da39dc977121e6c435d7726e

/home/norepi/Documents/Solidity/HumbleDonationsContracts/node_modules/ethers/src.ts/utils/errors.ts:694
            error = new Error(message);
                    ^
Error: transaction execution reverted (action="sendTransaction", data=null, reason=null, invocation=null, revert=null, transaction={ "data": "", "from": "0xcc5534897319D6A8DB7BD87B43d23aEE0Ad94799", "to": "0x3e3CAA2AE0B10757921b479F5db0F51475C2fE39" }, receipt={ "_type": "TransactionReceipt", "blobGasPrice": null, "blobGasUsed": null, "blockHash": "0x00008eba000012225248ef2304880d8f049e5371811d99cd6464b2e28d9fbfda", "blockNumber": 68012408, "contractAddress": null, "cumulativeGasUsed": "1081346", "from": "0xcc5534897319D6A8DB7BD87B43d23aEE0Ad94799", "gasPrice": "1025001000", "gasUsed": "1022999", "hash": "0x685cfdb626c2223c437c63aff1a0d07efd1d10a51ea251001f3d25fa6852e594", "index": 2, "logs": [  ], "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "root": null, "status": 0, "to": "0x3e3CAA2AE0B10757921b479F5db0F51475C2fE39" }, code=CALL_EXCEPTION, version=6.13.1)
    at makeError (/home/norepi/Documents/Solidity/HumbleDonationsContracts/node_modules/ethers/src.ts/utils/errors.ts:694:21)
    at assert (/home/norepi/Documents/Solidity/HumbleDonationsContracts/node_modules/ethers/src.ts/utils/errors.ts:715:25)
    at checkReceipt (/home/norepi/Documents/Solidity/HumbleDonationsContracts/node_modules/ethers/src.ts/providers/provider.ts:1585:19)
    at txListener (/home/norepi/Documents/Solidity/HumbleDonationsContracts/node_modules/ethers/src.ts/providers/provider.ts:1635:33)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)

*/
