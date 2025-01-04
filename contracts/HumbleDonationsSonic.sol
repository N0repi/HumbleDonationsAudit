// SPDX-License-Identifier: MIT

// HumbleDonations.sol

/// @dev Scope of HumbleDonations
/*
  Allows users to mint projects which contain webpage metadata.
  Users can donate ERC-20 tokens or nativec currency to projects safely.
  Have fun, stay safe!

  - Norepi 
*/

pragma solidity >=0.8.20;
pragma abicoder v2;
// NonUpgradeable
import "./IHumbleDonations.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// Swap
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
//// Upgradeable
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

using SafeERC20 for IERC20;

// Interface for WETH to wrap ether
interface IWETH {
    function deposit() external payable;
}

interface ISolidlySwapRouter {
    struct Route {
        address from;
        address to;
        bool stable;
    }
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        Route[] calldata routes,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapExactETHForTokens(uint amountOutMin, Route[] calldata routes, address to, uint deadline)
    external
    payable
    returns (uint[] memory amounts);
}

contract HumbleDonationsSonic is IHumbleDonations,
Initializable, ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor state-variable-immutable

    constructor() {
        _disableInitializers();
    }
    
    /*
    * Testnet: 0xf08413857AF2CFBB6edb69A92475cC27EA51453b 
    * RouterV2: 0x7635cD591CFE965bE8beC60Da6eA69b6dcD27e4b
    * RouterV3: 0xcC6169aA1E879d3a4227536671F85afdb2d23fAD
    * */
    // -----CONSTANTS-----
    
    address private constant SWAP_ROUTER = 0xcC6169aA1E879d3a4227536671F85afdb2d23fAD;
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    ISolidlySwapRouter public immutable swapRouter = ISolidlySwapRouter(SWAP_ROUTER);
    // -----CONSTANTS-----


    // Contract is upgradable in the interest of upgrading to a Rust-based Stylus contract in the future.
    function initialize(address initialOwner) initializer public {
        __ERC721_init("Humble Donations", "Project");
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        _tokenIdCounter = 1;
        taxPercentage = 15;
        mintRate = 0.005 ether;
        upgradeCount = 0;
    }

    // -----MAPPINGS-----
    // Mapping of tokenId to projectTitle
    mapping(uint256 => string) public tokenIdToProjectTitle;

    // Reverse mapping for projectTitle to tokenId
    mapping(string => uint256) public projectTitleToTokenId;
    // -----MAPPINGS-----


    // -----DECLARATIONS-----
    address private constant recipient1 = 0xBFD674dd1e4cDae881d0a9f5e9aC1C8232a38a40; // Sonic Safe
    address private constant recipient2 = 0x12FB341C803fC94Edd0481f8BDaB1A3B971521A6; // Sonic Dev Safe

    uint256 public upgradeCount; // Variable to track the number of upgrades
    address public HDT;
    address public WETH;
    uint256 public taxPercentage;
    uint256 public mintRate; // mintRate for safeMint
    uint256 private _tokenIdCounter; // Counter for token IDs  |  # initialized to 1 to make safeMint checks valid
    bytes32 public merkleRoot;
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

    // Set the mintRate for minting ERC721 token 
    function set_mintRate(uint256 _mintRate) external onlyOwner {
        mintRate = _mintRate; // 0.0001 ether mintRate upon deployment
    }
    // Get the mintRate value
    function get_mintRate() external view returns (uint256) {
        return mintRate;
    }

    // Set taxPercentage
    function setTaxPercentage(uint256 tax) external onlyOwner {
        // # set limit to tax rate
        require(tax <= 300, "tax cannot be higher than 30%");
        // tax = 15 == 1.5%;
        taxPercentage = tax;
    }
    // Get tax percentage
    function getPercentage() external view returns (uint256) {
        return taxPercentage;
    }

    // set Merkle Root of token whitelist
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }
    // ------SET/CHANGE VARIABLES AFTER DEPLOYMENT------

   // Helper function to check if token is whitelisted
    function isTokenWhitelisted(address erc20Token, bytes32[] calldata proof) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(erc20Token));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }


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
        require(msg.value >= mintRate, "Not enough ETH sent");
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
        // Using call method because call does not have a fixed gas lmit. Using payable for safety
        (bool success, ) = payable(recipient2).call{value: mintRate}("");
        require(success, "Mint Rate transfer failed");

        emit ProjectCreated(tokenId, to, projectTitle, uri, block.timestamp);
    }
    // -----CREATE PROJECT-----


    // -----TRANSFER PROJECT OVERRIDE-----
    /*
    # Override the _transfer function
    Prevents transfering a project to address
    which has ownership over another project
    */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(ERC721Upgradeable, IERC721) {
        // Ensure the recipient does not already own a token
        require(balanceOf(to) == 0, "Recipient already owns a project NFT");

        // Proceed with the normal transfer operation
        super.transferFrom(from, to, tokenId);
    }
    // -----TRANSFER PROJECT OVERRIDE-----


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
        uint256 amountIn,
        uint256 slippageWETH,
        uint256 slippageHDT
    ) internal returns (uint256 amountOut) {
        // Deadline in same tx
        uint256 deadline = block.timestamp;
        // Transfer amountIn of tokenIn to this contract
        IERC20(tokenIn).safeTransferFrom(
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
            IERC20(WETH).safeTransfer(recipient2, halfWETH);

            // Transfer 25% WETH to recipient1
            IERC20(WETH).safeTransfer(recipient1, oneQuarterWETH);

        } else {
            // Swap 100% of amountIn to WETH
            ISolidlySwapRouter.Route[] memory routesToWETH = new ISolidlySwapRouter.Route[](1);
            routesToWETH[0] = ISolidlySwapRouter.Route({
                from: tokenIn,
                to: WETH,
                stable: false
            });

            uint[] memory wethParams = swapRouter.swapExactTokensForTokens(
                amountIn,
                slippageWETH,
                routesToWETH,
                address(this),
                deadline
            );
            // Executes the swap
            amountOut = wethParams[wethParams.length - 1];

            // Transfer 75% of amountIn WETH to recipients

            // halfWETH = 50% of amountIn WETH
            halfWETH = amountOut / 2;

            // oneQuarterWETH = 25% of amountIn WETH
            oneQuarterWETH = amountOut / 4;

            // Transfer 50% WETH to recipient2
            IERC20(WETH).safeTransfer(recipient2, halfWETH);

            // Transfer 25% WETH to recipient1
            IERC20(WETH).safeTransfer(recipient1, oneQuarterWETH);
        }

        // Approving 1/4 WETH for swap to HDT
        TransferHelper.safeApprove(WETH, address(swapRouter), oneQuarterWETH);

        // Swap remaining 25% of amountIn WETH to HDT
        ISolidlySwapRouter.Route[] memory routesToHDT = new ISolidlySwapRouter.Route[](1);
        routesToHDT[0] = ISolidlySwapRouter.Route({
            from: WETH,
            to: HDT,
            stable: false
        });

        // Swap remaining 25% of WETH to HDT
        uint[] memory amountsOut = swapRouter.swapExactTokensForTokens(
            oneQuarterWETH,
            slippageHDT,
            routesToHDT,
            address(this),
            deadline
        );
        // Executes the swap
        uint256 amountOutHDT = amountsOut[amountsOut.length - 1];

        // Burn 25%, HDT
        ERC20Burnable(HDT).burn(amountOutHDT);
    }

    /* 
    swapExactInputSingleETH takes a slightly different route by handling the swap in ETH
    which eliminates the need for safeApprove, thereby optimizing efficiency. 
    */ 
    function swapExactInputSingleETH(
        uint256 amountIn,
        uint256 slippageHDT
    ) internal returns (uint256 amountOut) {
        // Deadline in same tx
        uint256 deadline = block.timestamp;

        require(amountIn > 0, "Amount in must be greater than 0");

        // Declared 3/4 of amountIn for wrapping
        uint256 threeQuartersETH = (amountIn * 3) / 4;
        require(threeQuartersETH > 0, "Three quarters of amountIn must be greater than 0");

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
        ISolidlySwapRouter.Route[] memory routes = new ISolidlySwapRouter.Route[](1);
        routes[0] = ISolidlySwapRouter.Route({
            from: WETH,
            to: HDT,
            stable: false
        });

        // Swap 25% WETH to HDT
        uint[] memory amountsOut = swapRouter.swapExactETHForTokens{value: oneQuarterWETH}(
            slippageHDT, 
            routes,
            address(this),
            deadline
        );
        // Executes the swap
        amountOut = amountsOut[amountsOut.length - 1];
        // Burn 25%, HDT
        ERC20Burnable(HDT).burn(amountOut);
    }
    // -----ROUTER LOGIC-----


    // -----DONATION LOGIC-----
    function donate(
        uint256 tokenId,
        address erc20Token,
        uint256 amount,
        uint256 slippageWETH,
        uint256 slippageHDT,
        bytes32[] calldata proof
    ) external payable nonReentrant {
        // Ensure the sender is not the token owner
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender != tokenOwner, "Cannot pay yourself");
        // Ensure that the project title is available before making payments
        require(
            bytes(tokenIdToProjectTitle[tokenId]).length > 0,
            "Project title not set"
        );

        // Prevents donations for tokenOwners that own more than one ERC-721 token
        require(balanceOf(tokenOwner) <= 1, "Token owner already owns more than one project NFT");

        // # Check to require that called amount is greater than 0
        require(amount > 0, "Input amount cannot be 0");

        uint256 total;
        uint256 taxAmount = (amount * taxPercentage) / 1000;

        IERC20 tokenContract = IERC20(erc20Token);
        if (erc20Token != address(HDT)) {
            total = amount - taxAmount;
            // ---If ETH is donated---
            if (erc20Token == address(0)) {
                // If the input token is ETH, ensure the sender has sent exactly the required amount
                require(msg.value >= amount, "Incorrect amount of ETH sent");

                // Performs swap of ETH, including wrapping ETH
                swapExactInputSingleETH(taxAmount, slippageHDT);

                // Using call method because call does not have a fixed gas lmit. Using payable for safety
                (bool success, ) = payable(tokenOwner).call{value: total}("");
                require(success, "ETH transfer failed");

            // ---If ERC-20 is donated---
            } else {
                // Whitelist  |  Checks whether input erc20Token is listed in the merkle proof
                require(isTokenWhitelisted(erc20Token, proof), "Token is not whitelisted");

                require(
                    tokenContract.allowance(msg.sender, address(this)) >= amount,
                    "Insufficient allowance"
                    
                );

                // Performs swap of ERC-20 token
                swapExactInputSingle(
                    erc20Token,
                    taxAmount,
                    slippageWETH,
                    slippageHDT
                );

                // Transfer total amount to the contract | eg. 98.5%
                tokenContract.safeTransferFrom(msg.sender, tokenOwner, total);
                    
            }
        // ---If ERC-20 tax-exempt token is donated (HDT)---
        } else {
            total = amount;

            // Ensure the sender has a sufficient token balance
            require(
                tokenContract.allowance(msg.sender, address(this)) >= amount,
                "Insufficient allowance"
            );

            // Transfer total amount to the contract | eg. 98.5%
            tokenContract.safeTransferFrom(msg.sender, tokenOwner, total);
        }
        // emits event to track donations via The Graph
        emit DonationMade(tokenId, msg.sender, erc20Token, total, block.timestamp);
    }
    // -----DONATION LOGIC-----


    // -----DELETE PROJECT-----
    function burnToken(uint256 tokenId) external {
        // Function called to delete a project & burn associated ERC-721 project
        address previousOwner = ownerOf(tokenId);

        // Only the owner of the token can burn the token
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner");

        // Retrieve the project title before burning the token
        string memory projectTitle = tokenIdToProjectTitle[tokenId];

        // Burn token
        _burn(tokenId);

        // Remove the tokenId from tokenIdToProjectTitle mapping
        delete tokenIdToProjectTitle[tokenId];

        // Remove the projectTitle from projectTitleToTokenId mapping
        delete projectTitleToTokenId[projectTitle];

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
    This block exists to withdraw tokens accidently sent 
    to or otherwise accumulated by this contract.
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

        // safeTransfer the ERC-20 tokens to the contract owner
        tokenContract.safeTransfer(msg.sender, amount);
    }
    // -----WITHDRAW-----


    // Reserved slots for future upgrades
    uint256[440] private __gap;
}