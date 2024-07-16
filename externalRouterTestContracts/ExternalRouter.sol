// SPDX-License-Identifier: MIT

// ExternalRouter.sol
// Deployed on Sepolia -- hardcoded addresses are likely to change when deployed on mainnet

pragma solidity >=0.7.0 <0.9.0;
pragma abicoder v2;


// Swap
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";


// Interface for WETH to directly call deposit function
interface IWETH {
    function deposit() external payable;
}

contract ExternalRouter {

    address private constant SWAP_ROUTER_02 = (0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E);
    IV3SwapRouter public immutable swapRouter = IV3SwapRouter(SWAP_ROUTER_02);


    // -----DECLARATIONS-----
    address public WETH = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address public HDT = 0x59964556eE1673479c973D8B04e7fFd0eccB1544;
    address public UNI = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984;

    address public constant recipient1 = 0x9c461F7A96c4aA3b83b67049de69155274B4d6EC; // safe
    address public constant recipient2 = 0x88b944E7E3D495B88cAa62FB0158F697C9A1561d; // dev
    
    uint24 public constant poolFee = 3000;
    // -----DECLARATIONS-----
    

    // -----ROUTER LOGIC-----
    function swapExactInputMultihop(
        address tokenIn,
        uint256 amountIn
    ) public returns (uint256 amountOut) {
        // Transfer amountIn of tokenIn to this contract
        TransferHelper.safeTransferFrom(
            tokenIn,
            msg.sender,
            address(this),
            amountIn
        );

        // Approve tokenIn to the swap router
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        // Declared outside of if-else statement to be accessible by approval & swap to HDT         
        uint256 halfWETH;
        uint256 oneQuarterWETH;

        if (tokenIn == WETH) {
            // halfWETH = 50% of amountIn in WETH
            halfWETH = amountIn / 2;

            // oneQuarterWETH = 25% of amountIn in WETH
            oneQuarterWETH = amountIn / 4;

            // Transfer 50% WETH to recipient2
            TransferHelper.safeTransfer(WETH, recipient2, halfWETH);

            // Transfer 25% WETH to recipient1
            TransferHelper.safeTransfer(WETH, recipient1, oneQuarterWETH);

        } else {
            // Swap 100% of amountIn to WETH
            IV3SwapRouter.ExactInputSingleParams memory wethParams =
                IV3SwapRouter.ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: WETH,
                    fee: poolFee,
                    recipient: address(this),
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });
            // Executes the swap
            amountOut = swapRouter.exactInputSingle(wethParams);

            // Transfer 75% of amountIn WETH to recipients

            // halfWETH = 50% of amountIn WETH
            halfWETH = amountOut / 2;

            // oneQuarterWETH = 25% of amountIn WETH
            oneQuarterWETH = amountOut / 4;

            // Transfer 50% WETH to recipient2
            TransferHelper.safeTransfer(WETH, recipient2, halfWETH);

            // Transfer 25% WETH to recipient1
            TransferHelper.safeTransfer(WETH, recipient1, oneQuarterWETH);
        }

        // Approving 1/4 WETH for swap to HDT
        TransferHelper.safeApprove(WETH, address(swapRouter), oneQuarterWETH);

        // Swap remaining 25% of amountIn WETH to HDT
        IV3SwapRouter.ExactInputSingleParams memory params =
            IV3SwapRouter.ExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: HDT,
                fee: poolFee,
                recipient: address(this),
                amountIn: oneQuarterWETH,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        // Executes the swap
        uint256 amountOutHDT = swapRouter.exactInputSingle(params);

        // Transfer 25% HDT to recipient1
        TransferHelper.safeTransfer(HDT, recipient1, amountOutHDT);
    }

    /* 
    swapExactInputSingleETH takes a slightly different route by handling the swap in ETH
    which eliminates the need for safeApprove, thereby optimizing efficiency. 
    */ 
    function swapExactInputSingleETH(
        uint256 amountIn
    ) public returns (uint256 amountOut) {
        uint256 minOut = 0; // Set the minimum output amount to 0 for simplicity
        uint160 priceLimit = 0; // Set the price limit to 0 for simplicity

        // Declared 3/4 of amountIn for wrapping
        uint256 threeQuartersETH = amountIn * 3 / 4;

        // Wrap 75% ETH to WETH
        IWETH(WETH).deposit{value: threeQuartersETH}();

        // halfWETH = 50% of amountIn in WETH
        uint256 halfWETH = amountIn / 2;

        // oneQuarterWETH = 25% of amountIn in WETH
        uint256 oneQuarterWETH = amountIn / 4;

        // Transfer 50% WETH to recipient2
        TransferHelper.safeTransfer(WETH, recipient2, halfWETH);

        // Transfer 25% WETH to recipient1
        TransferHelper.safeTransfer(WETH, recipient1, oneQuarterWETH);

        // Swap 25% of amountIn ETH to HDT - because this portion of amountIn was not wrapped, no approval is required
        IV3SwapRouter.ExactInputSingleParams memory params = IV3SwapRouter.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: HDT,
            fee: poolFee,
            recipient: address(this),
            amountIn: oneQuarterWETH,
            amountOutMinimum: minOut,
            sqrtPriceLimitX96: priceLimit
        });
        // Executes the swap
        amountOut = swapRouter.exactInputSingle{value: oneQuarterWETH}(params);

        // Transfer 25% HDT to recipient1
        TransferHelper.safeTransfer(HDT, recipient1, amountOut);
    }
    // -----ROUTER LOGIC-----

}