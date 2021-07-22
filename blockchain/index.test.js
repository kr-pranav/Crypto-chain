const Blockchain = require('./index');
const Block = require('./block');
const  { cryptoHash }  = require('../util');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');   

describe('Blockchain', () => {
  //const blockchain = new Blockchain();
  let blockchain, newChain, originalChain, errorMock;

  beforeEach(() => {                                  //variable gets set freshly before each function in the given scope.
    blockchain = new Blockchain();
    newChain = new Blockchain();
    errorMock = jest.fn();

    originalChain = blockchain.chain;
    global.console.error = errorMock;
  });

  it('contains a `chain` Array instance', () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });

  it('starts with the genesis block', () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });

  it('adds a new block to the chain', () => {
    const newData = 'last-data';
    blockchain.addBlock({ data: newData });

    expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData);
  });


  //to check the working of isValidChain() function
  describe('isValidChain()', () => {
    describe('when the chain does not start with the genesis block', () => {
      it('returns false', () => {
        blockchain.chain[0] = { data: 'fake-genesis' };
            //since `data` of genesis block is tampered (above line), expect our function isValidChain() to return false.
        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe('when the chain starts with the genesis block and has multiple blocks', () => {
      beforeEach(() => {
        blockchain.addBlock({ data: 'Bears' });
        blockchain.addBlock({ data: 'Beets' });
        blockchain.addBlock({ data: 'Battlestar Galactica' });
      });

      describe('and a lastHash reference has changed', () => {
        it('returns false', () => {
          blockchain.chain[2].lastHash = 'broken-lastHash';
              //since `lastHash` of 3rd block is tampered (above line), expect our function isValidChain() to return false.
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a block with an invalid field', () => {
        it('returns false', () => {
          blockchain.chain[2].data = 'some-bad-and-evil-data';
              //since `data` of 3rd block is tampered (above line), expect our function isValidChain() to return false.
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a bad-block with a jumped difficulty', () => {
        it('returns false', () => {
          const lastBlock = blockchain.chain[blockchain.chain.length-1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const nonce = 0;
          const data = [];

          const difficulty = lastBlock.difficulty - 3;
          
          const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
          const badBlock = new Block({
            timestamp, lastHash, hash, nonce, difficulty, data
          });

          blockchain.chain.push(badBlock);

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });
      
      describe('and the chain does not contain any invalid blocks', () => {
        it('returns true', () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
    });
  });


  //to check the working of replaceChain() function
  describe('replaceChain()', () => {
    let logMock;

    beforeEach(() => {
      logMock = jest.fn();                           //to suppress its functionality in test.js file

      global.console.log = logMock;
    });

    describe('when the new chain is not longer', () => {
      beforeEach(() => {
        newChain.chain[0] = { new: 'chain' };       //to differentiate the newChain.chain from blockchain.chain (because both are created in same manner)

        blockchain.replaceChain(newChain.chain);
      });

      it('does not replace the chain', () => {
        expect(blockchain.chain).toEqual(originalChain);
      });

      it('logs an error', () => {
        expect(errorMock).toHaveBeenCalled();         //to check whether an error is logged.
      });
    });

    describe('when the new chain is longer', () => {
      beforeEach(() => {                              //to make the newChain longer, add some new blocks.
        newChain.addBlock({ data: 'Lion' });          
        newChain.addBlock({ data: 'Tiger' });
        newChain.addBlock({ data: 'Elephant' });
      });

      describe('and the chain is invalid', () => {
        beforeEach(() => {
          newChain.chain[2].hash = 'some-fake-hash';
                //if some data of newChain is illegal, then replacement should not happen.

          blockchain.replaceChain(newChain.chain);
        });

        it('does not replace the chain', () => {
          expect(blockchain.chain).toEqual(originalChain);
        });

        it('logs an error', () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the chain is valid', () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain);
        });

        it('replaces the chain', () => {
          expect(blockchain.chain).toEqual(newChain.chain);
        });

        it('logs about the chain replacement', () => {
          expect(logMock).toHaveBeenCalled();           //to check whether success msg is logged.
        });
      });
    });

    describe('when the `dataValidationFlag` is true and transaction data needs to be checked', () => {
      it('calls `validateTransactionData()` function', () => {
        const validateTransactionDataMock = jest.fn();
        blockchain.validateTransactionData = validateTransactionDataMock;   //make sure that validateTransactionData() is not called hereafter in this file. 
                                                                      //if it wants to be called, reset its original functionality after the current test.
        newChain.addBlock({ data: 'dummy-data' });          //inorder to make newChain longer
        blockchain.replaceChain(newChain.chain, true);

        expect(validateTransactionDataMock).toHaveBeenCalled();
      });
    });
  });

  describe('validateTransactionData()', () => {
    let transaction, rewardTransaction, wallet;

    beforeEach(() => {
      wallet = new Wallet();
      transaction = wallet.createTransaction({ recipient: 'foo-address', amount: 75 });
      rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
    });

    describe('transaction data is valid', () => {
      it('returns true and does not log an error', () => {
        newChain.addBlock({ data : [transaction, rewardTransaction] });

        expect(blockchain.validateTransactionData({ incomingChain : newChain.chain })).toBe(true);
        expect(errorMock).not.toHaveBeenCalled();
      });
    });
    
    //transaction data is invalid - any 1 of 4 rules is broken
    describe('transaction data has multiple rewards', () => {         //there can be only one miner per bblock, So only one reward transaction should be present.
      it('returns false and logs an error', () => {
        newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });

        expect(blockchain.validateTransactionData({ incomingChain : newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('transaction data has atleast one malformed output', () => {
      describe('normal transaction', () => {
        it('returns false and logs an error', () => {
          transaction.outputMap[wallet.publicKey] = 999999;

          newChain.addBlock({ data : [transaction, rewardTransaction] });

          expect(blockchain.validateTransactionData({ incomingChain : newChain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
      describe('reward transaction', () => {
        it('returns false and logs an error', () => {
          rewardTransaction.outputMap[wallet.publicKey] = 999999;

          newChain.addBlock({ data : [transaction, rewardTransaction] });

          expect(blockchain.validateTransactionData({ incomingChain : newChain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });
    /*
    describe('transaction data has atleast one malformed input (mostly input.amount not matching current balance)', () => {
      it('returns false and logs an error', () => {
          wallet.balance = 9000;

          const evilOutputMap = {
            anyRecipient: 100,
            [wallet.publicKey]: 8900
          }

          const evilInput = {
            timestamp: Date.now(),
            amount: wallet.balance,
            address: wallet.publicKey,
            signature: wallet.sign(evilOutputMap)
          }

          const evilTransaction = {
            input: evilInput,
            outputMap: evilOutputMap
          }

          newChain.addBlock({ data : [evilTransaction, rewardTransaction] });

          expect(blockchain.validateTransactionData({ incomingChain : newChain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
      });
    });
    */
    describe('there are multiple identical transactions in same block', () => {
      it('returns false and logs an error', () => {
        newChain.addBlock({ data : [transaction, transaction] });

        expect(blockchain.validateTransactionData({ incomingChain : newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();  
      });
    });
  });
});