const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

describe('Transaction', () =>{
    let transaction, senderWallet, recipient, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50;

        transaction = new Transaction({senderWallet, recipient, amount});
    });

    it('has an `id` field', () => {
        expect(transaction).toHaveProperty('id');
    });


    describe('has `outputMap` field', () => {
        it('has an `outputMap', () => {
            expect(transaction).toHaveProperty('outputMap');
        });
        it('outputs the amount to recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });
        it('outputs the remaining balance', () => {
            expect(transaction.outputMap[senderWallet.publicKey]).
                toEqual(senderWallet.balance - amount);
        });
    });


    describe('has `input` field', () => {
        it('has an `input`', () => {
            expect(transaction).toHaveProperty('input');
        });

        it('has a `timestamp` in input', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });
        
        it('sets the `amount` to `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('sets the `address` to `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the `input`', () => {
            expect( 
                verifySignature ({
                    publicKey : senderWallet.publicKey,
                    data : transaction.outputMap, 
                    signature: transaction.input.signature
                })
            ).toBe(true);
        });
    });

    describe('validateTransaction()', () => {
        let errorMock;

        beforeEach( () => {
            errorMock = jest.fn();

            global.console.error = errorMock;
        });

        describe('when transaction is valid', () => {
            it('returns true', () => {
                expect(Transaction.validateTransaction(transaction)).toBe(true);
            });
        });

        describe('when transaction is invalid', () => {
            describe('transaction `outputMap` is invalid', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 999999;         //actually it must contain the remaining balance of senderWallet.

                    expect(Transaction.validateTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('transaction `input` signature is faked', () => {
                it('returns false', () => {
                    transaction.input.signature = new Wallet().sign();              //since the signature should be in correct format (r and s), create a new wallet and set a valid signature as faked-one.

                    expect(Transaction.validateTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });   
        });
    });

    describe('updateTransaction()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

        describe('`nextAmount` is invalid', () => {
            it('throws an error', () => {
                expect( () => {
                    transaction.updateTransaction({
                        senderWallet, newRecipient:'nextRecipient', newAmount: 999999
                    })
                }).toThrow('`Transaction` cannot be updated as newAmount is greater than balance in account');
            });
        });


        describe('`nextAmount` is valid', () => {
             beforeEach( () => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-recipient';
                nextAmount = 100;

                transaction.updateTransaction({
                    senderWallet, newRecipient: nextRecipient, newAmount: nextAmount
                });
            });

            it('outputs amount to the recipient account', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });

            it('balance after `transaction` gets updated', () => {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            });

            it('check whether `transaction` is updatable that is `newAmount` is lesser than balance', () => {
                expect( Object.values(transaction.outputMap).reduce( (total, singleSpend) => total + singleSpend)).
                    toEqual(transaction.input.amount);
            });

            it('re-signs the `transaction`', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('add another update to the same recipient', () => {
                it('adds to existing amount of same recipient', () => {
                    const extraAmount = 150;

                    transaction.updateTransaction({
                        senderWallet, newRecipient: nextRecipient, newAmount: extraAmount   //same recipient, but different amount
                    });

                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + extraAmount);
                });

                it('balance gets updated correctly after newTransfer to same recipient', () => {
                    const extraAmount = 150;

                    transaction.updateTransaction({
                        senderWallet, newRecipient: nextRecipient, newAmount: extraAmount   //same recipient, but different amount
                    });

                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount - extraAmount);
                });
            });
        });
    });

     describe('rewardTransaction()', () => {
        let rewardTransaction, minerWallet;

        beforeEach( () => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({ minerWallet });
        });

        it('creates a transaction for rewarding the miner with `REWARD_INPUT` field', () => {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });

        it('to check whether miner is rewarded with `MINING_REWARD`', () => {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
     });
});