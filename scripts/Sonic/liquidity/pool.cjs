// pool.js

const {
  abi,
} = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

const {
  abi: IUniswapV3Pool,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");

async function initializePool() {
  const token0Address = "0x54c3F0c4AfA850Ce839994aE6512699d4dD9b075"; // WETH
  const token1Address = "0x37E2e52309FaA2b1e1a7AEc8502Be68886f33733"; // HDT
  const fee = 3000;

  await checkExisting(token0Address, token1Address, fee);
  console.log("Pool checked!");

  const V3facoty = "0xBb5F17b4b598641AD1D946E3C2cEf23Fb96249D4";
  const factory = await ethers.getContractAt(abi, V3facoty);
  try {
    if (existingPool == "0x0000000000000000000000000000000000000000") {
      const tx = await factory.createPool(token0Address, token1Address, fee);
      const receipt = await tx.wait();
      console.log(`Transaction receipt: ${receipt.hash}`);
    } else {
      return;
    }
  } catch (error) {
    console.error("Transaction failed:", error);
    if (error.error && error.error.message) {
      console.error("Revert reason:", error.error.message);
    }
  }
}

initializePool().catch((error) => {
  console.error("Error initializing pool:", error);
  process.exit(1);
});

// Babylonian method for square root calculation
function sqrt(value) {
  if (value === 0n) {
    return 0n;
  }

  let x = value;
  let y = (x + 1n) >> 1n;
  while (y < x) {
    x = y;
    y = (value / y + y) >> 1n;
  }
  return x;
}

async function checkExisting(token0Address, token1Address, fee) {
  const V3facoty = "0xBb5F17b4b598641AD1D946E3C2cEf23Fb96249D4";
  const factory = await ethers.getContractAt(abi, V3facoty);

  const existingPool = await factory.getPool(token0Address, token1Address, fee);
  if (existingPool !== "0x0000000000000000000000000000000000000000") {
    console.log(`Pool already exists at address: ${existingPool}`);

    const poolAddress = "0x88d5963BfBA1d47a3ab74CDeA2Cf70D4B556e596"; // Your pool address
    const pool = await ethers.getContractAt(IUniswapV3Pool, poolAddress);

    const price = ethers.parseUnits("100", 18); // Represents 1 token0 = 100 token1
    const sqrtPriceX96 = sqrt(price) * (1n << 96n);
    const initializePool = await pool.initialize(sqrtPriceX96);
    await initializePool.wait();
    console.log(`sqrtPriceX96 calculated`);
    console.log(`initializePool log: ${initializePool}`);

    return existingPool;
  }

  // Proceed to create the pool if it doesn't exist
  const tx = await factory.createPool(token0Address, token1Address, fee);
  const receipt = await tx.wait();
  console.log(`Pool created at address: ${receipt.address}`);
}

// Pool already exists at address: 0x88d5963BfBA1d47a3ab74CDeA2Cf70D4B556e596
