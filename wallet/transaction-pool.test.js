const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');

describe('TransactionPool', () => {
    let transactionPool, transaction, senderWallet;

    beforeEach( () => {
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({
            senderWallet: senderWallet,
            recipient: 'fake-recipient',
            amount: 50
        });
    });

    describe('setTransaction()', () => {
        it('adds a transaction', () => {
            transactionPool.setTransaction(transaction);

            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);   //toBe() is used for strict comparison of underlying objects, rather than simply comparing the object references by toEqual() function
        });
    });

    describe('existingTransaction()', () => {
        it('returns an existing transaction object', () => {
            transactionPool.setTransaction(transaction);        //to make the test exisiting in transaction pool

            expect(transactionPool.existingTransaction({ walletAddress : senderWallet.publicKey })).
                toBe(transaction);
        });
    });

    describe('validTransactions()', () => {
        let validTransactionsArray, errorMock;

        beforeEach( () => {
            validTransactionsArray = [];

            for(let i=0; i<10; i++){
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'any-recipient',
                    amount: 30
                });

                if(i%3 === 0){
                    transaction.input.amount = 999999;
                }
                else if(i%3 === 1){
                    transaction.input.signature = new Wallet().sign('dummy-wallet');
                }
                else {
                    validTransactionsArray.push(transaction);
                }

                transactionPool.setTransaction(transaction);
            }

            errorMock = jest.fn();
            global.console.error = errorMock;
        });

        it('returns the valid transactions from transactionPool', () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactionsArray);
        });

        it('logs an error for invlid transactions', () => {
            transactionPool.validTransactions();            //while checking all the transactions in transactionPool, invalid transactions will cause an error.
            expect(errorMock).toHaveBeenCalled();
        });
    });

    describe('clearTransactionPool()', () => {
        it('clears the transactions in pool', () => {
            transactionPool.clearTransactionPool();

            expect(transactionPool.transactionMap).toEqual({});
        });
    });

    describe('clearBlockchainTransactions()', () => {
        it('clears only the transactions which are added to blockchain', () => {
            const blockchain = new Blockchain();
            const remainingTransactionsMap = {};

            for(let i=0; i<6; i++){
                const transaction = new Wallet().createTransaction({ 
                    amount:20,
                    recipient: 'any-recipient'
                });

                transactionPool.setTransaction(transaction);

                if(i%2 === 0){
                    blockchain.addBlock({ data : [transaction] });          //add half of the transactions to blockchain, to check whether only these transactions get cleared from the pool.
                }
                else{
                    remainingTransactionsMap[transaction.id] = transaction;
                }
            }

            transactionPool.clearBlockchainTransactions({ chain : blockchain.chain });

            expect(transactionPool.transactionMap).toEqual(remainingTransactionsMap);
        });
    });
});
 