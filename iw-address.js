const ecc = require('./utils/crypto.js')
const btckey = require('iwcrypto/btckey')
const accounts = require('./utils/accounts')
const acc = require('./iw-account')
/**
 * 从助记词创建钱包
 */
 export const fromMnemonic = (mnemonic) => {
	 const path = `m/44'/195'/0'/0/0`;
	 let privateKey = btckey.getKey(mnemonic, path)
	 let wallet = fromPrivateKey(privateKey)
	 wallet.mnemonic = mnemonic
	 return wallet
}
export const fromRandom = () => accounts.generateAccount()

/**
 * 从私钥创建钱包
 */
export const fromPrivateKey = (privateKey) => {
	const address = ecc.pkToAddress(privateKey)
	return {
		address,
		privateKey,
		mnemonic: ''
	};
}
/**
 * 验证地址正确
 */
export const isAddress = (address) => {
	return ecc.isAddressValid(address);
}
module.exports = {
	fromMnemonic,
	fromRandom,
	fromPrivateKey,
	isAddress,
	...acc
}
