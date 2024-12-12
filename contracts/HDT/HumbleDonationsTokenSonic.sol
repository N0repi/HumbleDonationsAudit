// SPDX-License-Identifier: MIT

// HumbleDonationsTokenSonic.sol

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract HumbleDonationsTokenSonic is
    ERC20,
    ERC20Burnable,
    ERC20Pausable,
    Ownable,
    ERC20Permit,
    ERC20Votes
{
    // Max supply of the token
    uint256 public immutable maxSupply = 100000000 * 10 ** decimals();

    constructor(
        address initialOwner
    )
        ERC20("Humble Donations Token", "HDT")
        Ownable(initialOwner)
        ERC20Permit("HDT")
    {
        _mint(initialOwner, 100000000 * 10 ** decimals());
    }

    function pause() public onlyOwner {
        _pause();
        emit Paused(msg.sender);
    }

    function unpause() public onlyOwner {
        _unpause();
         emit Unpaused(msg.sender);
    }

    // Mint token
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Max supply exceeded");
        _mint(to, amount);
    }
    

    // ------VIEW FUNCTIONS FOR SUPPLY STATS------

    // Constant lock address
    address lockAddress = 0x586B253113910da4557029C0598a59Fa5Cf2D697;

    // View function to make the locked supply visible
    function lockedSupply() public view returns (uint256) {
        return balanceOf(lockAddress);
    }
    // View burned balance
    function burnedSupply() public view returns (uint256) {
        uint256 burnedTokens = balanceOf(address(0));
        return burnedTokens;
    }
    // View function to make the circulating supply visable
    function circulatingSupply() public view returns (uint256) {
        uint256 burnedTokens = burnedSupply();
        uint256 lockedTokens = balanceOf(lockAddress);
        return totalSupply() - burnedTokens - lockedTokens;
    }

    // ------VIEW FUNCTIONS FOR SUPPLY STATS------


    // The following functions are overrides required by Solidity.

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Pausable, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

}
