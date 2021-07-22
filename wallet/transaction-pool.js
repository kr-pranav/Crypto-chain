const Transaction = require('./transaction');
const Wallet = require('./index');

class TransactionPool{
    constructor(){
        this.transactionMap = {};
    }

    setTransaction(transaction){
        this.transactionMap[transaction.id] = transaction;
    }

    replaceTransactionMap(newTransactionMap){
        this.transactionMap = newTransactionMap;
        console.log('The transactionMap got replaced');
    }

    existingTransaction({ walletAddress }){
        const allTransactions = Object.values(this.transactionMap);

        return allTransactions.find( transaction => transaction.input.address === walletAddress);
    }

    validTransactions(){
        return Object.values(this.transactionMap).filter(               // filter() -> segregates elements into separate array which satisfies the given condition.
            (transaction) => Transaction.validateTransaction(transaction)
        );
    }

    clearTransactionPool(){
        this.transactionMap = {}; 
    }

    clearBlockchainTransactions({ chain }) {
         for(let i=1; i<chain.length; i++){
             const block = chain[i];

             //to loop through all transactions in a particular block.
             for(let transaction of block.data){            //creates a variable for each array element automatically.
                 if(this.transactionMap[transaction.id]){
                     delete this.transactionMap[transaction.id];
                 }
             }
         }
    }
};

module.exports = TransactionPool;