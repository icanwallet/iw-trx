import TronWeb from './index.js';
const defalutAbi = require('iwcrypto/eth/abi.json')
const ecc = require('./utils/crypto.js')
const {
	ajax,
	getNodeUrl,
	getDate,
	fixNumber
} = require('@/iwcrypto/util.js')
const trc20Data = require('./lib/contract/trc20.js')
/**
 * 配置信息
 */
export let config = require('./iw-config.js')
/**
 * 默认节点
 */
config.nodeUrl = config.node.find(el => el.isdef == 1).url
/**
 * 获取代币的名称和decimal
 * 
 * @param {String} token
 * @return {Object | Boolean}
 */
export const tokenInfo = async (token) => {
	let [err, res] = await ajax({
		url: `${config.tronscan.url}contract?contract=${token}`
	});
	if (res && res.data && res.data.data && res.data.data.length > 0) {
		return res.data.data[0]['tokenInfo'];
	}
	return false;
}
/**
 * 获取abi
 * @param {String} token
 *  @return {Object|Boolean}
 */
export const getAbi = async (token) => {
	let url = `${config.tronscan.url}contracts/code?contract=${token}`;
	let [err, res] = await ajax({
		url
	});
	let rt = res.data;
	//console.log(rt)
	//console.log(rt.status)
	if (rt && rt.status && rt.status.code == 0) {
		let abistr = rt.data.abi;
		//console.log(abistr)
		let abiobj = JSON.parse(abistr);
		//console.log(abiobj)
		if (abiobj && abiobj.entrys && abiobj.entrys.length > 1) {
			return abiobj.entrys;
		}
	}
	return false;
}
const defaultPrivateKey = '03C56DBB1184080750E76041DDF929EE788A9BAFC011D2DEB021A2FB78165458'
export const getWeb = (privateKey = defaultPrivateKey) => new TronWeb(config.nodeUrl, config.nodeUrl, config.nodeUrl,
	privateKey)

/**
 * 获取地址的资源信息
 * @param {String} address
 * @return {Object} 
 */
export const getAccountResources = async (address) => await getWeb().trx.getAccountResources(address)
/**
 * 获取合约对象
 * @param {String} privateKey
 * @param {String} token
 * @param {Object} abi
 * @return {Object}
 */
export const getContract = (privateKey, token, abi) => {
	const tronWeb = getWeb(privateKey)
	return tronWeb.contract(abi, token);
}
/**
 * 获取trx或代币的余额
 * 
 * @param {String} address
 * @param {String} token
 * @param {Number} decimal
 * @return {Object|Boolean}
 */
export const balanceOf = async (address, token = 'trx', decimal = 6) => {
	const tronWeb = getWeb()
	let balance = 0;
	//address = 'TU5BWDcaRvPnZNtbnnUzAdD6G1wiNMs9Et';
	if (token == 'trx') {
		balance = await tronWeb.trx.getBalance(address);
		balance = fixNumber(balance, 6);
	} else {
		let instance = await tronWeb.contract(defalutAbi, token);
		let balanceOf = await instance.balanceOf(address).call();
		balanceOf = tronWeb.toDecimal(balanceOf);
		balance = fixNumber(balanceOf, decimal);
	}
	return balance;
}
/**
 * 冻结trx获取能量或带宽
 * @param {String} privateKey
 * @param {Number} amount 要冻结的TRX的数量（单位是SUN）。
 * @param {Number} duration 冻结 TRX 的天数，至少 3 天。
 * @param {String} resource "BANDWIDTH" or "ENERGY"
 * @param {String} receiverAddress 接收资源的其他用户的地址。
 * 
 */
export const freezeBalance = async (privateKey, amount = 1, duration = 3, resource = 'ENERGY', receiverAddress) => {
	let tronWeb = getWeb(privateKey);
	const address = ecc.pkToAddress(privateKey)
	const regNumber = /^\+?[1-9][0-9]*$/
	amount = (!regNumber.test(amount) || amount < 1) ? 1 : amount
	duration = (!regNumber.test(duration) || duration < 3) ? 3 : duration
	resource = resource != 'BANDWIDTH' ? 'ENERGY' : 'BANDWIDTH'
	receiverAddress = receiverAddress ? receiverAddress : address
	const signStr = await tronWeb.transactionBuilder.freezeBalance(tronWeb.toSun(amount), duration, resource,
		address, receiverAddress, 1);
	const signedTxn = await tronWeb.trx.sign(signStr, privateKey);
	const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);
	return receipt
}
/**
 * 发布一个简单的trc20合约（usdt）
 * @param {String} privateKey
 * @param {Number} total_supply 总发布多少
 * @param {String} name 代币名字
 * @param {String} symbol 代币符号
 * @param {Number} decimals 代币的位数
 * 
 */
export const deployContract = async (privateKey, total_supply = 100000000000, name = 'Tether USD', symbol = 'USDT',
	decimals = 6) => {
	let url = `${config.nodeUrl}/wallet/deploycontract`
	let address = ecc.pkToAddress(privateKey)
	let tronWeb = getWeb(privateKey);
	console.log(address);
	const options = {
		feeLimit: 1000000000, //能够燃烧的trx的阀值，最大1000000000sun（1TRX = 1,000,000SUN）
		callValue: 0, //本次调用往合约转账的trx（1TRX = 1,000,000SUN）
		tokenId: "", //本次调用往合约中转账10币的id，如果没有，不需要设置  
		tokenValue: 0, //本次调用往合约中转账10币的数量，如果不设置token_id，这项设置为0或者不设置
		userFeePercentage: 100, //指定的使用该合约用户的资源占比，是[0, 100]之间的整数。如果是0，则表示用户不会消耗资源。如果开发者资源消耗完了，才会完全使用用户的资源。
		originEnergyLimit: 10000000, //创建者设置的，在一次合约执行或创建过程中创建者自己消耗的最大的energy，是大于0的整数
		abi: JSON.stringify(trc20Data.abi), //Abi 字符串格式
		bytecode: trc20Data.code, //bytecode，需要是hexString格式
		parameters: [total_supply, name, symbol, decimals], //构造函数的参数列表，需要按照ABI encoder编码后转话为hexString格式。如果构造函数没有参数，该参数可以不用设置。
		name: name, //合约名
		permissionId: 0 //可选参数，多重签名时使用
	};
	const tradeObj = await tronWeb.transactionBuilder.createSmartContract(options, address);
	//console.log(signedTxn);
	const signedTxn = await tronWeb.trx.sign(tradeObj, privateKey);
	const receipt = await tronWeb.trx.sendRawTransaction(signedTxn);
	return receipt


}
/**
 * 转账
 * 
 * @param {String} privateKey
 * @param {String} token  eg. 'trx' or 'token address'
 * @param {String} receiver
 * @param {Number} amount
 * @param {Object} op
 * @param {Number} decimal
 * @return {Object}
 */
export const transfer = async (privateKey, token = 'trx', receiver, amount, op = {}, decimal = 18) => {
	let tronWeb = getWeb(privateKey);
	let tx;
	if (token == 'trx') {
		tx = await tronWeb.trx.sendTransaction(receiver, amount * 1000000);
	} else {
		let instance = await tronWeb.contract(defalutAbi, token);
		amount = Number(amount * Math.pow(10, decimal));
		tx = await instance.transfer(receiver, amount).send();
	}
	return tx;
}

export const logs = async (address, token = 'trx', page = 1, pagesize = 20) => {
	if (token == 'trx') {
		return await logsTron(token, address, page, pagesize);
	} else {
		return await logsTrc20(token, address, pagesize);
	}
}
export const logsTron = async (token, address, page = 1, pagesize = 20) => {
	//address = '0xf78a149be085ff02bc5de35578d52055a47a619e';
	page = page < 1 ? 1 : page;
	page = page - 1;
	let data = [];
	let start = page * pagesize;
	let url =
		`${config.tronscan.url}transfer?sort=-timestamp&count=true&limit=${pagesize}&start=${start}&token=_&address=${address}`;
	let [error, rtdata] = await ajax({
		url
	});
	if (!rtdata || !rtdata.data || !rtdata.data.data || rtdata.data.data.length < 1) return [];
	let rs = rtdata.data.data;
	//console.log(rtdata.data);
	rs.forEach(ps => {
		ps['from'] = ps['transferFromAddress'];
		ps['to'] = ps['transferToAddress'];
		ps['tsType'] = (ps['from'].toLowerCase() == address.toLowerCase()) ? 'out' : 'in'
		ps['token'] = ps['tokenInfo']['tokenName']
		ps['address'] = address
		ps['hash'] = ps['transactionHash'];
		ps['value'] = fixNumber(ps['amount'], ps['tokenInfo']['tokenDecimal'])
		ps['time'] = getDate(ps['timestamp'] / 1000)
		ps['timeStamp'] = ps['timestamp'] / 1000
		ps['blockNumber'] = ps['block']
	})
	return rs;
}
/**
 * 只支持懒加载
 */
let fingerprints = [];
export const logsTrc20 = async (token, address, pagesize) => {
	let url =
		`${config.trongrid.url}v1/accounts/${address}/transactions/trc20?contract_address=${token}&limit=${pagesize}`;
	let len = fingerprints.length;
	if (len > 0) {
		let fp = fingerprints[len - 1]
		url =
			`${config.trongrid.url}v1/accounts/${address}/transactions/trc20?contract_address=${token}&limit=${pagesize}&fingerprint=${fp}`;
	}
	//decimals = getDecimal(token);
	let [error, res] = await ajax({
		url
	});
	//console.log(url);
	//console.log(res);
	if (!res || !res.data || !res.data.data || res.data.data.length < 1) {
		//fingerprint = '';
		return [];
	}
	let rd = res.data;
	console.log(rd);
	let rs = rd.data;
	if (rd.meta && rd.meta.links && rd.meta.links.next) {
		let fingerprint = rd.meta.fingerprint;
		if (fingerprint && !fingerprints.includes(fingerprint)) {
			fingerprints.push(fingerprint)
		}
	}
	let data = [];
	rs.forEach(ps => {
		ps['tsType'] = (ps['from'].toLowerCase() == address.toLowerCase()) ? 'out' : 'in'
		ps['token'] = token
		ps['address'] = address
		ps['hash'] = ps['transaction_id'];
		ps['value'] = fixNumber(ps['value'], ps['token_info']['decimals'])
		ps['time'] = getDate(ps['block_timestamp'] / 1000)
		ps['timeStamp'] = ps['block_timestamp'] / 1000
		ps['blockNumber'] = ps['time'] //此处只做适配
	})

	return rs;
}
