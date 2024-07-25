// SPDX-License-Identifier: MIT

// HumbleDonations.sol

pragma solidity >=0.7.0 <0.8.26;
pragma abicoder v2;

// NonUpgradeable
import "./IHumbleDonations.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//
// Swap
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";
//
// Upgradeable
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

// Interface for WETH to wrap ether
interface IWETH {
    function deposit() external payable;
}

contract HumbleDonations is IHumbleDonations,
Initializable, ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor state-variable-immutable

    constructor() {
        _disableInitializers();
    }

    /* 
    ****
    Ideally, I would like to move all of the Uniswap code to a seperate contract. 
    However, after great attempts, I have been unable to get the ERC20 swap and 
    swapExactInputSingleETH to succeed. Relying on a pre-defined address for 
    SWAP_ROUTER_02 and respected functions are a weakness of this contract.

    Calling to the external swap router contract directly with JS/TS result in successful
    transactions.
    ****
    */
    
    // -----CONSTANTS-----
    address private constant SWAP_ROUTER_02 = (0x101F443B4d1b059569D643917553c771E1b9663E);
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    IV3SwapRouter public immutable swapRouter = IV3SwapRouter(SWAP_ROUTER_02);
    // -----CONSTANTS-----


    // Contract is upgradable in the interest of upgrading to a Rust-based Stylus contract in the future.
    function initialize(address initialOwner) initializer public {
        __ERC721_init("HumbleDonations", "HDproject");
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        taxPercentage = 15;
        mintRate = 0.0001 ether;
        upgradeCount = 0;
    }

    // -----MAPPINGS-----
    // Mapping of tokenId to projectTitle
    mapping(uint256 => string) public tokenIdToProjectTitle;

    // Reverse mapping for projectTitle to tokenId
    mapping(string => uint256) public projectTitleToTokenId;
    // -----MAPPINGS-----


    // -----DECLARATIONS-----
    address private constant recipient1 = 0x68b43a1c7DfC773Ac84c37A62BfA76e3055b7074; // Temp wallet for Arbitrum Sepolia | sepolia safe
    address private constant recipient2 = 0x88b944E7E3D495B88cAa62FB0158F697C9A1561d; // dev

    uint256 public upgradeCount; // Variable to track the number of upgrades
    address public HDT;
    address public WETH;
    uint256 public taxPercentage;
    uint256 public mintRate; // mintRate for safeMint
    uint256 public fees; // fees for safeMint - may be unnecessary
    uint24 public constant poolFee = 3000; // uni pool fee med
    uint256 private _tokenIdCounter; // Counter for token IDs
    // -----DECLARATIONS-----


    // ------UPGRADE------
   function getUpgradeCount() external view returns (uint256) {
        // returns upgrade counter
        return upgradeCount;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {        
        // Increment the upgrade count whenever an upgrade is authorized
        upgradeCount++;
    }

    // Supports interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    // ------UPGRADE------
    

    // ------SET/CHANGE VARIABLES AFTER DEPLOYMENT------
    // Set HDT
    function setHDT(address _HDT) external onlyOwner {
        HDT = _HDT;
    }
    // Get HDT
    function getHDT() external view returns (address) {
        return HDT;
    }

    // Get WETH
    function getWETH() external view returns (address) {
        return WETH;
    }
    // Set WETH
    function setWETH(address _WETH) external onlyOwner {
        WETH = _WETH;
    }


    // Set taxPercentage
    function setTaxPercentage(uint256 tax) external onlyOwner {
        // tax = 15 == 1.5%;
        taxPercentage = tax;
    }
    // Set the mintRate for minting ERC721 token 
    function set_mintRate(uint256 _mintRate) external onlyOwner {
        mintRate = _mintRate; // 0.0001 ether mintRate upon deployment
    }

    // Get tax percentage
    function getPercentage() external view returns (uint256) {
        return taxPercentage;
    }
    // Get the mintRate value
    function get_mintRate() external view returns (uint256) {
        return mintRate;
    }
    // ------SET/CHANGE VARIABLES AFTER DEPLOYMENT------


    // -----COUNTER-----
    function latestTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
    // -----COUNTER-----


    // -----CREATE PROJECT-----
    function safeMint(
        address to,
        string memory uri,
        string memory projectTitle
    ) external payable nonReentrant {
        require(msg.value >= fees + mintRate, "Not enough ETH sent");
        require(balanceOf(to) == 0, "Address already owns a token");
        require(
            projectTitleToTokenId[projectTitle] == 0,
            "Project title already exists"
        );
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        tokenIdToProjectTitle[tokenId] = projectTitle;

        // Update reverse mapping
        projectTitleToTokenId[projectTitle] = tokenId;

        payable(recipient2).transfer(mintRate);

        emit ProjectCreated(tokenId, to, projectTitle, uri, block.timestamp);
    }
    // -----CREATE PROJECT-----


    // -----CHECKS FOR OWNERSHIP-----
    function getOwnerByProjectTitle(
        string memory projectTitle
    ) external view returns (address) {
        uint256 tokenId = projectTitleToTokenId[projectTitle];
        if (tokenId != 0) {
            return ownerOf(tokenId);
        }
        return address(0);
    }

    // Getter function to retrieve the tokenId associated with a given projectTitle
    function getTokenId(string memory projectTitle) public view returns (uint256) {
        return projectTitleToTokenId[projectTitle];
    }
    // -----CHECKS FOR OWNERSHIP-----



    // -----ROUTER LOGIC-----
    function swapExactInputSingle(
        address tokenIn,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
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
    ) internal returns (uint256 amountOut) {
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


    // -----DONATION LOGIC-----
    function donate(
        uint256 tokenId,
        address erc20Token,
        uint256 amount
    ) external payable nonReentrant {
        // Ensure the sender is not the token owner
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender != tokenOwner, "Cannot pay yourself");
        // Ensure that the project title is available before making payments
        require(
            bytes(tokenIdToProjectTitle[tokenId]).length > 0,
            "Project title not set"
        );
        uint256 total;
        uint256 taxAmount = (amount * taxPercentage) / 1000;

        IERC20 tokenContract = IERC20(erc20Token);
        if (erc20Token != address(HDT)) {
            total = amount - taxAmount;
            // ---If ETH is donated---
            if (erc20Token == address(0)) {
                // If the input token is ETH, ensure the sender has sent exactly the required amount
                require(msg.value >= amount, "Incorrect amount of ETH sent");

                // Perform the multihop swap, including wrapping of ETH if needed
                swapExactInputSingleETH(taxAmount); 
                payable(tokenOwner).transfer(total);

            // ---If ERC-20 is donated---
            } else {
                require(
                    tokenContract.allowance(msg.sender, address(this)) >= amount,
                    "Insufficient allowance"
                    
                );

                swapExactInputSingle(
                    erc20Token,
                    taxAmount
                );
                require(
                    // Transfer total amount to the contract | eg. 98.5%
                    tokenContract.transferFrom(msg.sender, tokenOwner, total),
                    "Transfer total failed"
                );
            }
        // ---If ERC-20 tax-exempt token is donated (HDT)---
        } else {
            total = amount;

            // Ensure the sender has a sufficient token balance
            require(
                tokenContract.allowance(msg.sender, address(this)) >= amount,
                "Insufficient allowance"
            );

            require(
                // Transfer total amount to the contract | 100%
                tokenContract.transferFrom(msg.sender, tokenOwner, total),
                "Transfer total failed"
            );
        }
        // emits event to track donations via The Graph
        emit DonationMade(tokenId, msg.sender, erc20Token, total, block.timestamp);
    }
    // -----DONATION LOGIC-----


    // -----DELETE PROJECT-----
    function burnToken(uint256 tokenId) external {
        // Only the owner of the token can burn the token
        address previousOwner = ownerOf(tokenId);
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner");
        _burn(tokenId);

        // emits token being burned, the owner of the token before it was burned, the burn address, and the current time stamp
        emit ProjectDeleted(tokenId, previousOwner, address(0), block.timestamp);
    }
    // -----DELETE PROJECT-----


    // -----URI-----
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    // -----URI-----


    // -----WITHDRAW-----
    /* 
    Tokens are not intended to be held by this contract
    This section exists to withdraw tokens sent to this contract
    or otherwise accumulated.
    */

    // Withdraw ETH
    function withdraw() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer Failed");
    }

    // Withdraw ERC-20
    function withdrawToken(
        address erc20Token,
        uint256 amount
    ) external onlyOwner {
        require(erc20Token != address(0), "Invalid ERC-20 token address");
        // Interact with the ERC-20 token contract to transfer tokens
        IERC20 tokenContract = IERC20(erc20Token);
        // Ensure the contract has a sufficient token balance
        require(
            tokenContract.balanceOf(address(this)) >= amount,
            "Insufficient token balance"
        );

        // Transfer the ERC-20 tokens to the contract owner
        require(
            tokenContract.transfer(msg.sender, amount),
            "Token transfer failed"
        );
    }
    // -----WITHDRAW-----


    // Reserved slots for future upgrades
    uint256[50] private __gap;
}