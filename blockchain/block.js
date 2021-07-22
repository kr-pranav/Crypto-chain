const hexToBinary = require('hex-to-binary'); 
const { GENESIS_DATA, MINE_RATE } = require('../config');
const  { cryptoHash } = require('../util');

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {   //{arg1,arg2,..} - no need to remember the order.
    this.timestamp = timestamp;                                           // single object
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  static genesis() {
    return new this(GENESIS_DATA);              //*this* will also work instead of Block
  }

  static adjustDifficulty({originalBlock, newTimestamp}) {
    const { difficulty } = originalBlock;
    
    if(difficulty < 1)
      return 1;

    if((newTimestamp - originalBlock.timestamp) > MINE_RATE)
      return difficulty - 1;

    return difficulty + 1;

  }

  static mineBlock({ lastBlock, data }) {         //to create a new block with valid details.
    const lastHash = lastBlock.hash;
    let hash, timestamp;
    let { difficulty } = lastBlock;
    
    let nonce = 0;
    do {
      nonce++;  
      timestamp = Date.now();                     //to get the correct timestamp when `hash` is generated.
      difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, newTimestamp: timestamp})
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
    } while(hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

    return new this({ timestamp, lastHash, data, difficulty, nonce, hash });
  }
  
}

/* Experimenting code
const block1 = new Block(
    {
        data:'demo-data',
        hash:'demo-hash',
        timestamp:'01/01/01',
        lastHash:'demo-lastHash'
    }
);
console.log(block1);
*/

module.exports = Block;
