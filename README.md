# Description

This repo is a hardhat enviroment. The contract (and interface) I would like audited is in ./contracts .
./externalRouterTestContracts is an attempt to get the Uniswap routing to an external contract- described in the first block-comment of HumbleDonations.sol . NOC21 was the last iteration of HumbleDonations.sol before it was rename to HumbleDonations.sol.

I can happily provide more scripts at request.

Hardhat/node commands:

```shell
yarn hardhat run scripts/deployHumbleDonations/deploy-NOC21SepoliaUUPS.js
yarn hardhat run scripts/deployHumbleDonations/upgrade-NOC21SepoliaUUPS.js

yarn node scripts/setGet/getEverything.mjs
yarn node scripts/setGet/getEverything.mjssetEssentials.mjs
```
