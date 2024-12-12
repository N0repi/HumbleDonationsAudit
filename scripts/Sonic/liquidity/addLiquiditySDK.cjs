// addLiquiditySDK.js

const { ethers } = require("ethers");
const { Token, Percent } = require("@uniswap/sdk-core");
const {
  Pool,
  Position,
  nearestUsableTick,
  MintOptions,
  NonfungiblePositionManager,
} = require("@uniswap/v3-sdk");
const {
  abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  abi: INonfungiblePositionManagerABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json");
// const {
//   abi: NonfungiblePositionManagerABI,
// } = require("@uniswap/v3-periphery/artifacts/contracts/libraries/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const ERC20ABI = require("./erc20.json");

require("dotenv").config();

const poolAddress = "0x326fDb8fB3D796124F9D7a3F8F0758D510823Aac"; // HDT/WETH Sepolia
const positionManagerAddress = "0x1238536071E1c677A632429e3655c799b22cDA52"; // NonfungiblePositionManager

const API_URL = process.env.API_URL_SEPOLIA;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS2;
const WALLET_SECRET = process.env.PRIVATE_KEY2;
const provider = new ethers.providers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(WALLET_SECRET, provider);

const name0 = "Wrapped Ether";
const symbol0 = "WETH";
const decimals0 = 18;
const address0 = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

const name1 = "Humble Donations Token";
const symbol1 = "HDT";
const decimals1 = 18;
const address1 = "0x9707Be4129F68B767aF550fe1c631BF1779623Cb";

const chainId = 11155111; // Sepolia
const WethToken = new Token(chainId, address0, decimals0, symbol0, name0);
const HdtToken = new Token(chainId, address1, decimals1, symbol1, name1);

const INonfungiblePositionManagerABIabi = INonfungiblePositionManagerABI;

const nonfungiblePositionManagerContract = new ethers.Contract(
  positionManagerAddress,
  INonfungiblePositionManagerABIabi,
  signer
);

const IUniswapV3PoolABIabi = IUniswapV3PoolABI;

const poolContract = new ethers.Contract(
  poolAddress,
  IUniswapV3PoolABIabi,
  provider
);

async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

// -----ADD LIQUIDITY TO UNISWAP POOL------
async function main() {
  const poolData = await getPoolData(poolContract);
  // console.log("poolData log:", poolData);

  const configuredPool = new Pool(
    WethToken,
    HdtToken,
    poolData.fee,
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    poolData.tick
  );
  // console.log("configuredPool log:", configuredPool);
  // *might want to change tick spacing range for testing
  const position = new Position({
    pool: configuredPool,
    liquidity: ethers.utils.parseUnits("0.1", 18),
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
    // useFullPrecision: true, //disabled for testing --> only used when Position.fromAmounts
  });
  // console.log("position log:", position);
  const approvalAmount = ethers.utils.parseUnits("0.1", 18).toString();
  const tokenContract0 = new ethers.Contract(address0, ERC20ABI, signer);
  await tokenContract0.approve(positionManagerAddress, approvalAmount, {
    gasLimit: 1000000,
  });

  const tokenContract1 = new ethers.Contract(address1, ERC20ABI, signer);
  await tokenContract1.approve(positionManagerAddress, approvalAmount, {
    gasLimit: 1000000,
  });

  const { amount0: amount0Desired, amount1: amount1Desired } =
    position.mintAmounts;
  // mintAmountsWithSlippage

  params = {
    token0: address0,
    token1: address1,
    fee: poolData.fee,
    recipient: WALLET_ADDRESS,
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: amount0Desired.toString(),
    amount1Min: amount1Desired.toString(),

    deadline: Math.floor(Date.now() / 1000) + 3600, // Deadline for the transaction (one hour from now)
  };

  const mintOptions = {
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  };

  // get calldata for minting a position
  const { calldata } = NonfungiblePositionManager.addCallParameters(
    position,
    mintOptions
  );
  console.log("calldata", calldata);
  const transaction = {
    data: calldata,
    to: nonfungiblePositionManagerContract.address,
    // value: value,
    // from: WALLET_ADDRESS,
    // maxFeePerGas: MAX_FEE_PER_GAS,
    // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  };
  const txRes = await signer.sendTransaction(transaction);
  console.log("txRes", txRes);
}
// Define the event listener function
function handleIncreaseLiquidity(tokenId, liquidity, amount0, amount1) {
  // Convert BigNumber values to integers
  const tokenIdint = tokenId.toNumber();
  const liquidityInt = liquidity.toNumber();
  const amount0Int = amount0.toNumber();
  const amount1Int = amount1.toNumber();
  console.log("Token ID int:", tokenIdint);
  console.log("Token ID:", tokenId);
  console.log("Liquidity:", liquidityInt);
  console.log("amount0Int:", amount0Int);
  console.log("amount1Int:", amount1Int);
  // ^overflow^
  // Token ID int: 15281
  // Token ID: BigNumber { _hex: '0x3bb1', _isBigNumber: true }
  // Liquidity: 1000000000000002
  // amount0Int: 255164534712046
  // amount1Int: 135724680255
  // Remove the event listener after processing the event
  nonfungiblePositionManagerContract.removeListener(
    "IncreaseLiquidity",
    handleIncreaseLiquidity
  );

  // Call the function to handle tokenId
  // incentiveToTokenId(tokenId);
}

// Attach the event listener
nonfungiblePositionManagerContract.on(
  "IncreaseLiquidity",
  handleIncreaseLiquidity
);
main();
// -----ADD LIQUIDITY TO UNISWAP POOL------

//
//
//

// -----ADD POSITION TO INCENTIVE------
const {
  abi: UniswapV3StakerABI,
} = require("./UniswapV3Staker.sol/UniswapV3Staker.json");

const { key: iKey } = require("./unhashedKey.json");

const erc20Abi = require("./erc20.json");

const {
  abi: EncodeIncentiveUniV3ABI,
} = require("./EncodeIncentiveUniV3.sol/EncodeIncentivesUniV3.json");

const {
  abi: NonfungiblePositionManagerABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

require("dotenv").config();

const IKEY_ADDRESS = "0xA0644ea21EDd55F454fB57FE62c6092E27b011b4";

const EncodeIncentiveUniV3ABIAbi = EncodeIncentiveUniV3ABI;

const iKeyInstance = new ethers.Contract(
  IKEY_ADDRESS,
  EncodeIncentiveUniV3ABIAbi,
  signer
);

const STAKER_ADDRESS = "0xf9a1CF576D52F63FdbA1012b72759a0135dF9d16";

const rewardToken = "0x6764F09fae548dCe83ed4e4499Ca3ef00814A9D6"; // rewards token PHHDT

const staker = new ethers.Contract(STAKER_ADDRESS, UniswapV3StakerABI);

const uniswapV3StakerABIAbi = UniswapV3StakerABI;
const UniswapV3StakerInstance = new ethers.Contract(
  STAKER_ADDRESS,
  uniswapV3StakerABIAbi,
  signer
);

const NonfungiblePositionManagerABIabi = NonfungiblePositionManagerABI;
const nonfungiblePositionManagerContractbase = new ethers.Contract(
  positionManagerAddress,
  NonfungiblePositionManagerABIabi,
  signer
);
// const UNI_V3_POS = "0x1238536071E1c677A632429e3655c799b22cDA52";
// const NFTcontract = new ethers.Contract(UNI_V3_POS, signer);

async function incentiveToTokenId(tokenId) {
  console.log("tokenId initValue:", tokenId);
  // APPROVAL
  // ****might need to approve NFT position instead****
  const rewardTokenContract = new ethers.Contract(
    rewardToken,
    ERC20ABI,
    signer
  );
  const approveRewardsToken =
    await nonfungiblePositionManagerContractbase.approve(
      UniswapV3StakerInstance.address,
      tokenId // need to check the contract and see what's up with this
    );
  await approveRewardsToken.wait();
  console.log("rewards token approval:", approveRewardsToken);

  //   const STFparams = (WALLET_ADDRESS, STAKER_ADDRESS, tokenId, iKey); // simple outputs the last value

  const STFoptions = {
    sender: WALLET_ADDRESS,
    recipient: STAKER_ADDRESS,
    tokenId: tokenId,
    _data: iKey, // hardcoding key doesn't work
  };
  //   const STFoptions = {
  //     options: STFparams,
  //   };
  console.log("STFoptions:", STFoptions);
  // get calldata for minting a position
  //   const { calldata } =
  //     NonfungiblePositionManager.safeTransferFromParameters(STFoptions);
  //   console.log("calldata:", calldata);
  //   const transaction = {
  //     data: calldata,
  //     to: nonfungiblePositionManagerContract.address,
  //   };
  //   const txRes = await signer.sendTransaction(transaction, {
  //     gasLimit: 1000000,
  //   });
  //   console.log("txRes", txRes);

  // SAFE TRANSFER FROM
  // ***** INonfungiblePositionManagerABIabi.approve is not a function ---- same with rewardTokenContract
  //   safeTransferFrom(0xb88d4fde); <--- correct bytecode   |   ---> incorrect bytecode safeTransferFrom (0x42842e0e)
  const STF = await nonfungiblePositionManagerContractbase[
    "safeTransferFrom(address,address,uint256,bytes)"
  ](WALLET_ADDRESS, STAKER_ADDRESS, tokenId, iKey, { gasLimit: 1000000 });
  await STF.wait();
  console.log("STF tx:", STF);

  // ** Failing with 'Fail with error 'UniswapV3Staker::stakeToken: non-existent incentive''

  // const DecodedKeyArray = {
  //   rewardToken: '0x6764F09fae548dCe83ed4e4499Ca3ef00814A9D6',
  //   pool: '0x326fDb8fB3D796124F9D7a3F8F0758D510823Aac',
  //   startTime: 1714105538,
  //   endTime: 1716697145,
  //   refundee: '0x88b944E7E3D495B88cAa62FB0158F697C9A1561d'
  // }

  // DECODE AND CHECK REWARDS
  const decodedKey = await iKeyInstance.decode(iKey);
  console.log("decodedKey:", decodedKey);

  const rewardInfo = await UniswapV3StakerInstance.getRewardInfo(
    decodedKey,
    tokenId
  );
  console.log("Reward Info:", rewardInfo);

  // NUMBER OF STAKED TOKENS IN INCENTIVE
  const encodedKey =
    "0x589d0a7990fbc6f583ac68d75b3d65e31a7414716144dace00c56271b0f0702d";
  const stakesPerIncentives = await UniswapV3StakerInstance.incentives(
    encodedKey
  );
  console.log("Stakes per current incentive:", stakesPerIncentives);
}
