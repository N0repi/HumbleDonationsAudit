# Description

This repo is a hardhat enviroment. The contract (and interface) I would like audited is in ./contracts . ABI is located artifacts/contracts/HumbleDonations.sol/HumbleDonations.json

Contract is live on Sepolia @ 0xB9fe62Fbd99B3A57699B4f10b246e69761D9FEB4
The verified proxy contract is @ 0xA065893FAd2802231684B067f2788D0BDEf8aDCd

I can happily provide more scripts at request.

Hardhat/node commands:

```shell
yarn hardhat run scripts/deployHumbleDonations/deploy-NOC21SepoliaUUPS.js
yarn hardhat run scripts/deployHumbleDonations/upgrade-NOC21SepoliaUUPS.js

yarn node scripts/setGet/getEverything.mjs
yarn node scripts/setGet/getEverything.mjssetEssentials.mjs
```
