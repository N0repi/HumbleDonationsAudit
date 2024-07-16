// SPDX-License-Identifier: MIT

// NOC21SepoliaUUPS.sol
// Deployed on Sepolia -- hardcoded addresses are likely to change when deployed on mainnet

pragma solidity >=0.7.0 <0.9.0;

// NonUpgradeable
import "./INOC20SepoliaUUPS.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//
// Upgradeable
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
// import "./ExternalRouter.sol";
interface IExternalRouter {
    function swapExactInputMultihop(address tokenIn, uint256 amountIn) external returns (uint256 amountOut);
    function swapExactInputSingleETH(uint256 amountIn) external payable returns (uint256 amountOut);
}

contract NOC21SepoliaUUPS is INOC20SepoliaUUPS,
Initializable, ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721BurnableUpgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor state-variable-immutable

    constructor() {
        _disableInitializers();
    }


    // Contract is upgradable in the interest of upgrading to a Rust-based Stylus contract in the future.
    function initialize(address initialOwner, address _externalRouterAddress) initializer public {
        __ERC721_init("NOC21SepoliaUUPS", "NOC21");
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        taxPercentage = 15;
        mintRate = 0.0001 ether;
        upgradeCount = 0;
        externalRouterAddress = _externalRouterAddress;
        externalRouter = IExternalRouter(_externalRouterAddress);
    }

    // -----MAPPINGS-----
    // Mapping of tokenId to projectTitle
    mapping(uint256 => string) public tokenIdToProjectTitle;

    // Reverse mapping for projectTitle to tokenId
    mapping(string => uint256) public projectTitleToTokenId;
    // -----MAPPINGS-----


    // -----DECLARATIONS-----
    address private constant recipient2 = 0x88b944E7E3D495B88cAa62FB0158F697C9A1561d; // dev
    uint256 public upgradeCount; // Variable to track the number of upgrades
    address public HDT;
    address public WETH;
    uint256 public taxPercentage;
    uint256 public mintRate; // mintRate for safeMint
    uint256 public fees; // fees for safeMint - may be unnecessary
    uint24 public constant poolFee = 3000; // uni pool fee med
    uint256 private _tokenIdCounter; // Counter for token IDs
    address public externalRouterAddress;
    IExternalRouter public externalRouter;
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

    // Set swap router address - Use when Uniswap inveitably upgrades
    function setExternalRouterAddress(address _externalRouterAddress) external onlyOwner {
        require(_externalRouterAddress != address(0), "Invalid address");
        externalRouterAddress = _externalRouterAddress;

    }
    // Get swap router address
    function getExternalRouterAddress() external view returns (address) {
        return externalRouterAddress;
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


    // -----DONATION LOGIC-----
    function makeDonation(
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
                externalRouter.swapExactInputSingleETH{value: taxAmount}(taxAmount); 
                payable(tokenOwner).transfer(total);

            // ---If ERC-20 is donated---
            } else {
                require(
                    tokenContract.allowance(msg.sender, address(this)) >= amount,
                    "Insufficient allowance"
                );

                // Transfer the tax amount to the contract
                require(tokenContract.transferFrom(msg.sender, address(this), taxAmount), "Transfer failed");
                // Approval of the external router contract
                require(tokenContract.approve(externalRouterAddress, taxAmount), "Approval failed");

                externalRouter.swapExactInputMultihop(
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
                // Transfer total amount to the contract | eg. 100%
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