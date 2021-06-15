const ecc = require('./utils/crypto.js')
//const lib = reqire('../libs/tron');

/**
 * 从助记词创建钱包
 */
 export const fromMnemonic = (mnemonic) => {
	 //const bitWallet = require('iw-btc/iw-address');
	 const path = `m/44'/195'/0'/0/0`;
	 //const privateKey = bitWallet.createPrivateKey(mnemonic, path);
	 const ec = require('iwcrypto/btckey')
	 let privateKey = ec.getKey(mnemonic, path)
	 let wallet = fromPrivateKey(privateKey);
	 wallet.mnemonic = mnemonic;
	 return wallet;
}

/**
 * 从私钥创建钱包
 */
export const fromPrivateKey = (privateKey) => {
	const address = ecc.pkToAddress(privateKey);
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
