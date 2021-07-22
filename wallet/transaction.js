const uuid = require('uuid/v1');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config'); 

class Transaction{
    constructor({ senderWallet, recipient, amount, outputMap, input }) {
        this.id = uuid();

        this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });

        this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    createOutputMap({ senderWallet, recipient, amount }){
        const outputMap = {};

        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

        return outputMap;
    }

    createInput({ senderWallet, outputMap }){
        return { 
            timestamp: Date.now(),
            amount: senderWallet.balance,       //initial amount
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        };
    }

    static validateTransaction(transaction) {
        const { outputMap, input } = transaction;

        const { address, amount, signature } = input;
        
        const totalSpend = Object.values(outputMap).reduce( (total, singleSpend) => total+singleSpend );
        if(amount !== totalSpend){                      //here `amount` refers to intial amount in the sender's account.              
            console.error(`Invalid transaction from address ${address}`);
            return false;
        }

        if(!verifySignature({ publicKey: address, data: outputMap, signature: signature })){
            console.error(`Invalid signature from address ${address}`);
            return false;
        }

        return true;
    }

    updateTransaction({ senderWallet, newRecipient, newAmount }) {
        if(newAmount > this.outputMap[senderWallet.publicKey]){
            throw new Error('`Transaction` cannot be updated as newAmount is greater than balance in account');     //automatically exits the function
        }

        if( ! this.outputMap[newRecipient])          //to check whether the recipient already exists
            this.outputMap[newRecipient] = newAmount;                               //if does not exist, put freshly in his account
        else
        this.outputMap[newRecipient] = this.outputMap[newRecipient] + newAmount;    //if exists, add amount to his account 

        this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - newAmount;

        this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    static rewardTransaction({ minerWallet }) {
        return new Transaction({
            input: REWARD_INPUT,
            outputMap: { [minerWallet.publicKey] : MINING_REWARD }
        }) 
    }
};

module.exports = Transaction ;