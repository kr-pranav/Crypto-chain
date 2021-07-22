const Transaction = require('../wallet/transaction');

class TransactionMiner{
    constructor({ blockchain, transactionPool, wallet, pubsub }){
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    mineTransactions() {
        //get the valid transactions from transaction pool
        const validTransactionsArray = this.transactionPool.validTransactions();

        //generate the miner's award
        validTransactionsArray.push(
            Transaction.rewardTransaction({ minerWallet : this.wallet })
        );

        //add a block consisting of these transactions to the blockchain
        this.blockchain.addBlock({ data : validTransactionsArray });


        //broadcast the updated blockchain
        this.pubsub.broadcastChain();

        //clear the pool
        this.transactionPool.clearTransactionPool();
    }
}


module.exports = TransactionMiner;
