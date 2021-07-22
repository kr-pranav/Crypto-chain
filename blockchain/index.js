const Block = require('./block');
const  { cryptoHash }  = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];     //to start with genesis block
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length-1],
      data
    });

    this.chain.push(newBlock);
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
        return false
    };

    for (let i=1; i<chain.length; i++) {
      const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];  //destructuring - to extract the variables of chain[i] as local variables inside this function.
      
      const actualLastHash = chain[i-1].hash;
      if (lastHash !== actualLastHash) 
          return false;

      const validHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
      if (hash !== validHash) 
          return false;
    
      const lastDifficulty = chain[i-1].difficulty;
      if (Math.abs(lastDifficulty - difficulty) > 1) 
          return false;
    }

    return true;
  }

  replaceChain(newchain, dataValidationFlag, onSuccess){
    if(newchain.length <= this.chain.length){       //if newchain is smaller than the existing chain, no replacement.
        console.error('The incoming chain must be longer !');
        return;
    }
    if(!Blockchain.isValidChain(newchain)){         //if the newchain is invlaid, no replacement.
        console.error('The incoming chain is invalid !');
        return;
    }

    if( dataValidationFlag && !this.validateTransactionData({ incomingChain: newchain }) ){
        console.error('The incoming chain has invalid transaction data !');
        return;
    }

    if(onSuccess)
        onSuccess();
        
    console.log('The chain got replaced.');
    this.chain = newchain;                         // replace this.chain with newchain
  }

  validateTransactionData({ incomingChain }) {

    for(let i=1; i<incomingChain.length; i++){
      const block = incomingChain[i];
      const transactionSet = new Set();           //contains only unique values  
      let rewardTransactionCount = 0;

      for(let transaction of block.data){
        if(transaction.input.address === REWARD_INPUT.address){
          rewardTransactionCount++;

          if(rewardTransactionCount > 1){
            console.error('Miner rewards exceed limit !');
            return false;
          }

           if(Object.values(transaction.outputMap)[0] !== MINING_REWARD){   //reward transaction's outputMap has only one element for sure, so access it directly using [0] syntax.
             console.error('Miner reward amount is invalid !');
             return false;
           }
        }
        else{
          if(!Transaction.validateTransaction(transaction)){
            console.error('Invalid transaction outputMap !');
            return false;
          }
          /*
          const trueBalance = Wallet.calculateBalance({
              chain: this.chain,                          //should check existing chain but `in steps` (till where we have traversed the new incomingChain)              
              reqWalletAddress: transaction.input.address
          }); 

          if( transaction.input.amount !== trueBalance ){
            console.error(`Invalid initial balance amount !`);
            return false;
          }
          */
          if(transactionSet.has(transaction)){
            console.error('Has multiple identical transactions in same block !')
            return false;
          }
          else{
            transactionSet.add(transaction);
          }
        }
      }
    }
    return true;
  }
}

module.exports = Blockchain;