const Wallet = require('./index');
const { verifySignature } = require('../util');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');

describe('Wallet class', () => {
    let wallet;

    beforeEach( () => {
        wallet = new Wallet();
    });

    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance');
    });

    it('has a `publicKey`', () => {
        //console.log(wallet.publicKey);
        
        expect(wallet).toHaveProperty('publicKey');
    });

    describe('capable of signing data', () => {
        const data = 'dummy-data';

        it('signature is correct',() => {
            expect( verifySignature({
                publicKey: wallet.publicKey,
                data,
                signature: wallet.sign(data)
            })).toBe(true);
        });

        it('signature is invalid',() => {
            expect( verifySignature({
                publicKey: wallet.publicKey,
                data,
                signature: new Wallet().sign(data)
            })).toBe(false);
        });

    });

    describe('createTransaction()', () => {
        describe('amount involving in transaction exceeds the existing balance', () => {
            it('throws an error', () => {
                expect( () => wallet.createTransaction({ amount:999999, recipient:'foo-recipient'}) ).toThrow('Amount exceeds existing balance');
            });
        });

        describe('amount involving in transaction is valid', () => {
            let amount, recipient, transaction;

            beforeEach( () => {
                amount = 50;
                recipient = 'foo-recipient';

                transaction = wallet.createTransaction({ amount , recipient })
            });
            
            it('returns a Transaction object', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            it('`transaction` inputs match with wallet details', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });
            
            it('`transaction` outputs are correct', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });

        describe('if a chain is passed', () => {
            it('calls `Wallet.calculateBalance`', () =>{
                const calculateBalanceMock = jest.fn();

                const originalBalance = Wallet.calculateBalance;    //to restore the original functionality of calaculateBalance() function after the current test.

                Wallet.calculateBalance = calculateBalanceMock;

                wallet.createTransaction({
                    recipient: 'dummy-recipient',
                    amount:10,
                    chain: new Blockchain().chain
                });

                expect(calculateBalanceMock).toHaveBeenCalled();

                Wallet.calculateBalance = originalBalance;
            });
        });
    });

    describe('calculateBalance()', () => {
        let blockchain;

        beforeEach( () => {
            blockchain = new Blockchain();
        });

        describe('`reqWallet` has not involved in any transactions', () => {
            it('returns the `SATRTING_BALANCE`', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        reqWalletAddress: wallet.publicKey
                    })
                ).toEqual(STARTING_BALANCE);
            });
        });

        describe('`reqWallet` has acted as a recipient', () => {
            let transactionOne , transactionTwo;

            beforeEach( () => {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 30
                });
                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 20
                });

                blockchain.addBlock({ data: [transactionOne, transactionTwo] });
            });

            it('adds all the incoming amounts to wallet balance', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        reqWalletAddress: wallet.publicKey
                    })
                ).toEqual(
                    STARTING_BALANCE + 
                    transactionOne.outputMap[wallet.publicKey] + 
                    transactionTwo.outputMap[wallet.publicKey]
                    );
            });
        });

        describe('`reqWallet` has made a transaction', () => {
            let recentTransaction;

            beforeEach( () => {
                recentTransaction = wallet.createTransaction({
                    recipient:'foo-address',
                    amount: 30
                });

                blockchain.addBlock({ data: [recentTransaction] });
            });

            it('returns the output balance of recent transaction (no incoming amounts after this transaction)', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        reqWalletAddress: wallet.publicKey
                    })
                ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
            });

            describe('after recent transaction, this wallet has incoming amounts in transactions of same block or further blocks', () => {
                let sameBlockTransaction, furtherBlockTransaction;

                beforeEach( () => {
                    recentTransaction = wallet.createTransaction({
                        recipient:'foo-address',
                        amount: 30
                    });

                    sameBlockTransaction = Transaction.rewardTransaction({ minerWallet : wallet });   //if the same local wallet owner is mining it, he will get an incoming reward amount.

                    blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction] });

                    furtherBlockTransaction = new Wallet().createTransaction({   //sender is some other new wallet
                        recipient: wallet.publicKey,                            //local wallet gets an incoming amount
                        amount: 70
                    });

                    blockchain.addBlock({ data: [furtherBlockTransaction] });
                });

                it('adds only the incoming amounts after recent transaction to the outputBalance shown in recent transaction', () => {
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            reqWalletAddress: wallet.publicKey
                        })
                    ).toEqual(
                        recentTransaction.outputMap[wallet.publicKey] +         //outptuBalance of recent transaction
                        sameBlockTransaction.outputMap[wallet.publicKey] +      //incoming amount in transaction of same block
                        furtherBlockTransaction.outputMap[wallet.publicKey]     //incoming amonts in transactions of further blocks
                    );
                });
            });
        });
    });

    
});