const EC = require('elliptic').ec;
const  cryptoHash  = require('../util/crypto-hash');

const ec = new EC('secp256k1');

const verifySignature = ({publicKey, data, signature}) => {
    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');

    return keyFromPublic.verify(cryptoHash(data),signature);    //returns either true or false
};

module.exports = { 
    ec,
    verifySignature,
    cryptoHash
};