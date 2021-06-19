
//import {utils} from 'iw-eth/index.js';
/*
const keccak256 = utils.keccak256;
const sha256 = utils.sha256;
const toUtf8Bytes = utils.toUtf8Bytes;
const recoverAddress = utils.recoverAddress;
const SigningKey = utils.SigningKey;
const AbiCoder = utils.AbiCoder;
*/

const AbiCoder = require('./eth/abi-coder');
const SigningKey = require('./eth/signing-key');
const sha256 = require('./eth/sha2').sha256;
const keccak256 = require('./eth/keccak256');
const utf8 = require('./eth/utf8');
const toUtf8Bytes = utf8.toUtf8Bytes;
const recoverAddress = SigningKey.recoverAddress
export {
    keccak256,
    sha256,
    toUtf8Bytes,
    recoverAddress,
    SigningKey,
    AbiCoder
}
