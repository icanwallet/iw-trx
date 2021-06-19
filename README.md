## iw-trx
>> This project provides a simple package to realize the core logic of the wallet. If you have any questions, please ask at the following website
[icanwallet](https://github.com/icanwallet/icanwallet)

## use case

``` javascript
//install
npm i iw-trx -s


//from mnemonic
const ecc = require('iw-trx')
const wallet = ecc.fromMnemonic(mnemonic)
console.log(wallet)
//from privateKey
const wallet2 = ecc.fromPrivateKey(wallet.privateKey)
console.log(wallet2)
//check address
console.log(ecc.isAddress(wallet.address))

```

## account

```javascripot
const testPrivatekey = '....'
const usdtToken = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'

const tokeninfo = await libs.tokenInfo(usdtToken)
console.log(tokeninfo);
const abiInfo = await libs.getAbi(usdtToken)
console.log(abiInfo);
			
const contracts = await libs.getContract(testPrivatekey, usdtToken, libs.defalutAbi);
console.log(contracts)

libs.config.nodeUrl = 'https://api.shasta.trongrid.io';
let  balance = await libs.balanceOf('TTfaBaMkqhWa36z9GzwncNmxY68XuZCxty')
console.log(balance)

let source = await libs.getAccountResources('TTfaBaMkqhWa36z9GzwncNmxY68XuZCxty')
console.log(source);

let deploy = await libs.deployContract(testPrivatekey)
console.log(deploy)

let freeze = await libs.freezeBalance(testPrivatekey,2);
console.log(freeze);

let rt = await libs.transfer(testPrivatekey, 'trx', 'TRVX2Kw7SdAkscke6Guv5RF933Chs1jHEp', 0.01)
console.log(rt)

let  logs = await libs.logs('TAUN6FwrnwwmaEqYcckffC7wYmbaS6cBiX', 'trx',1, 5)
console.log(logs)

let  logstrc = await libs.logs('TAUN6FwrnwwmaEqYcckffC7wYmbaS6cBiX', usdtToken,1, 5)
console.log(logstrc)
```