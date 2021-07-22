const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash} = require('../util');
const Transaction = require('./transaction');

class Wallet{
    constructor(){
        this.balance = STARTING_BALANCE;

        this.keyPair = ec.genKeyPair();

        this.publicKey = this.keyPair.getPublic().encode('hex');
    };

    sign(data){
        return this.keyPair.sign(cryptoHash(data));
    }

    createTransaction({ amount, recipient, chain }) {
        if(chain)
            this.balance = Wallet.calculateBalance({
                chain: chain,
                reqWalletAddress: this.publicKey
            });
        
        if(amount > this.balance)                              //`amount` here refers to amount involving in the transaction.
            throw new Error('Amount exceeds existing balance');
        
            
        return new Transaction({ senderWallet:this, amount, recipient });
    }

    static calculateBalance({ chain, reqWalletAddress }) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;

        for(let i=chain.length-1; i>0; i--){
            const block = chain[i];

            for(let transaction of block.data){
                if(transaction.input.address === reqWalletAddress)
                    hasConductedTransaction = true;

                const singleOutput = transaction.outputMap[reqWalletAddress];

                if(singleOutput)
                    outputsTotal = outputsTotal + singleOutput;
            }

            if(hasConductedTransaction)
                break;
        }

        return hasConductedTransaction ? outputsTotal :  STARTING_BALANCE + outputsTotal;
    }
}

module.exports = Wallet;