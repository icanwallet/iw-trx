import TronWeb from './index.js';
const defalutAbi = require('iwcrypto/eth/abi.json')
const {ajax, getNodeUrl, getDate, fixNumber} = require('@/iwcrypto/util.js')
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
		url : `https://apilist.tronscan.org/api/contract?contract=${token}`
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
		if(abiobj && abiobj.entrys && abiobj.entrys.length > 1) {
			return abiobj.entrys;
		}
	}
	return false;
}
const defaultPrivateKey = '03C56DBB1184080750E76041DDF929EE788A9BAFC011D2DEB021A2FB78165458'
export const getWeb = (privateKey = defaultPrivateKey) => new TronWeb(config.nodeUrl, config.nodeUrl, config.nodeUrl, privateKey)

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
export const getCantract = (privateKey, token, abi) => {
	const tronWeb = getWeb(privateKey)
	return await tronWeb.contract(abi, token);
}
/**
 * 获取trx或代币的余额
 * 
 * @param {String} address
 * @param {String} token
 * @param {Number} decimal
 * @return {Object|Boolean}
 */
export const balanceOf = async(address, token = 'tron', decimal = 6) => {
	const tronWeb = getWeb()
	let balance = 0;
	//address = 'TU5BWDcaRvPnZNtbnnUzAdD6G1wiNMs9Et';
	if (token == 'tron') {
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
 * 转账
 * 
 * @param {String} privateKey
 * @param {String} token  eg. 'eth' or 'token address'
 * @param {String} receiver
 * @param {Number} amount
 * @param {Object} op
 * @param {Number} decimal
 * @return {Object}
 */
export const transfer = async(privateKey, token = 'trx', receiver, amount, op = {}, decimal = 18) => {
	let tronWeb = getWeb(privateKey);
	let tx;
	if (token == 'tron') {
		tx = await tronWeb.trx.sendTransaction(receiver, account * 1000000);
	} else {
		let instance = await tronWeb.contract(defalutAbi, token);
		amount = Number(amount * Math.pow(10, decimal));
		tx = await instance.transfer(receiver, amount).send();
	}
	return tx;
}

export const logs = async (address, token = 'trx', page = 1, pagesize = 20) => {
	if(token == 'trx') {
		return await logsTron(token, address, page, pagesize);
	}else{
		return await logsTrc20(token, address, pagesize);
	}
}
export const logsTron = async (token, address, page = 1, pagesize = 20) => {
	//address = '0xf78a149be085ff02bc5de35578d52055a47a619e';
	page = page < 1 ? 1 : page;
	page = page - 1;
	let data = [];
	let start = page*pagesize;
	let url =
		`https://apilist.tronscan.io/api/transfer?sort=-timestamp&count=true&limit=${pagesize}&start=${start}&token=_&address=${address}`;
	let [error, rtdata] = await ajax({url});
	if (!rtdata || !rtdata.data || !rtdata.data.data || rtdata.data.data.length < 1) return [];
	let rs = rtdata.data.data;
	rs.forEach(ps => {
		ps['from'] = ps['transferFromAddress'];
		ps['to'] = ps['transferToAddress'];
		ps['tsType'] = (ps['from'].toLowerCase() == address.toLowerCase()) ? 'out' : 'in'
		ps['token'] = token
		ps['address'] = address
		ps['hash'] = ps['transaction_id'];
		ps['value'] = fixNumber(ps['value'], ps['token_info']['decimals'])
		ps['time'] = getDate(ps['block_timestamp'] / 1000)
		ps['timeStamp'] = ps['block_timestamp'] / 1000
		ps['blockNumber'] = ps['block']
	})
	return rs;
}
/**
 * 只支持懒加载
 */
let fingerprints = [];
export const logsTrc20 = async (token, address, pagesize) => {
	let	url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?contract_address=${token}&limit=${pagesize}`;
	let len = fingerprints.length;
	if(len > 0){
		let fp = fingerprints[len - 1]
		url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?contract_address=${token}&limit=${pagesize}&fingerprint=${fp}`;
	}
	//decimals = getDecimal(token);
	let [error, res] = await ajax({
		url
	});
	//console.log(url);
	//console.log(res);
	if(!res || !res.data || !res.data.data || res.data.data.length < 1) {
		//fingerprint = '';
		 return [];
	}
	let rd = res.data;
	let rs = rd.data;
	if(rd.meta && rd.meta.links && rd.meta.links.next) {
		let fingerprint = rd.meta.fingerprint;
		if(fingerprint && !fingerprints.includes(fingerprint)) {
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
		ps['blockNumber'] = ps['block_timestamp']
	})
	
	return rs;
}

