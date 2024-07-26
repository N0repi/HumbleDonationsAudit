# Humble Donations Contract

7/24/24

## Project Mission

The goal of this protocol is to create a donation & crowdfunding enviroment with minimal-to-no revenue cuts from the person receiving donations. I aim to create a better and much more transparent platform for online donations than traditional donation services. HumbleDonations.sol does not hold any currencies in it's contract, it securily facilitates the transactions. Donations are paid user-to-user, with HumbleDonations.sol only being approved to send balances directly to the recipient.

Humble Donations allows users to create a project (minting an ERC721 token) and seemlessly allow donations to be sent directly to the project's tokenId. All tokens of the ERC20 standard and Ether are acceptable forms of donations. All ERC20 tokens and Ether are subject to a tax (set by onlyOwner & defaulted to 1.5%). The exception being that Humble Donations Token (HDT) is exempt, meaning 100% of HDT donated is sent to the project owner (tokenId). The revenue accrued from taxes is reinvested into the growth and security of the protocol by

- funding a safe used as a treasury of HDT and allocation of WETH for a staking protocol not seen in this repository
- funding a developer wallet

HDT is also used as a governance token which does also not appear in this repository.

## Expected Rules of HumbleDonations.sol

A wallet address should not be able to mint a ERC721 token from `safeMint` if the wallet already owns a ERC721 token from this contract.

If a wallet address reliquinishes ownership of their ERC721 token by burning the token, calling `burnToken`, then wallet address should be able to mint another ERC721 token from `safeMint`.

`projectTitle` is a required input value for `safeMint` which defines the title of a (donation/crowdfunding) project. A ERC721 token should not be minted if the same `projectTitle` has previously been used in another ERC721 token.

This repo is a hardhat enviroment. The contract (and interface) I would like audited is in [contracts](https://github.com/N0repi/HumbleDonationsAudit/tree/main/contracts) . ABI is located [artifacts](artifacts/contracts/HumbleDonations.sol/HumbleDonations.json)

Verified contract is live on Sepolia

Implementation contract: [0xB9fe62Fbd99B3A57699B4f10b246e69761D9FEB4](https://sepolia.etherscan.io/address/0xB9fe62Fbd99B3A57699B4f10b246e69761D9FEB4)

Proxy contract: [0xA065893FAd2802231684B067f2788D0BDEf8aDCd](https://sepolia.etherscan.io/address/0xA065893FAd2802231684B067f2788D0BDEf8aDCd)

I can happily provide more scripts at request.

Hardhat/node commands:

Deploy contract
Upgrade contract

```shell
yarn hardhat run scripts/deployHumbleDonations/deploy-HumbleDonations.js
yarn hardhat run scripts/deployHumbleDonations/upgrade-HumbleDonations.js

yarn node scripts/setGet/getEverything.mjs
yarn node scripts/setGet/setEssentials.mjs
```

Create project (mint ERC721 token)
Delete project (burn ERC721 token)

```shell
yarn node test/mint_CreateProject.js
yarn node test/burnDelete_CreateProject.js
```

Project created using [test/mint_CreateProject.js] with the `contractAddress` of `0xB9fe62Fbd99B3A57699B4f10b246e69761D9FEB4` are viewable on [humbledonations.com](https://www.humbledonations.com/donate)

Making donations requires the use of two different wallet addresses- one for the sender and one for the recipient.
Please see the comments in [test/donateERC20.mjs](https://github.com/N0repi/HumbleDonationsAudit/tree/main/test/donateERC20.mjs) to adjust which tokens are being donated.
HDT can be swapped to on Uniswap, Sepolia, or you can set a different ERC20 token to subsitute the role of HDT in [scripts/setEssentials.mjs](https://github.com/N0repi/HumbleDonationsAudit/blob/main/scripts/setGet/setEssentials.mjs.)

```shell
yarn node test/donateERC20.mjs
yarn node test/donateETH.mjs
```

To use the hardhat commands, a .env file will need to be created which defines API_URL_SEPOLIA (or desired network) and PRIVATE_KEY
