const hexToBinary = require('hex-to-binary');
const Block = require('./block');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash }   = require('../util');

describe('Block', () => {
  //test to check whether a block is created in a correct manner
  const timestamp = 2000;
  const lastHash = 'foo-hash';
  const hash = 'bar-hash';
  const data = ['blockchain', 'data'];
  const nonce = 1;
  const difficulty = 1;
  
  const block = new Block({ timestamp, lastHash, hash, data, nonce, difficulty });  //if formal parameter and actual parameter have the same name, just write once. (no need of timestamp: timestamp)

  it('has a timestamp, lastHash, hash, and data property', () => {
    expect(block.timestamp).toEqual(timestamp);
    expect(block.lastHash).toEqual(lastHash);
    expect(block.hash).toEqual(hash);
    expect(block.data).toEqual(data);
    expect(block.nonce).toEqual(nonce);
    expect(block.difficulty).toEqual(difficulty);
  });

  //test for genesis block (from config.js file)
  describe('genesis()', () => {
    const genesisBlock = Block.genesis();       //we can call static functions with the class name itself (no need of creating an object).

    it('returns a Block instance', () => {
      expect(genesisBlock instanceof Block).toBe(true);
    });

    it('returns the genesis data', () => {
      expect(genesisBlock).toEqual(GENESIS_DATA);
    });
  });

  //test to add further blocks(mine blocks)
  describe('mineBlock()', () => {
    const lastBlock = Block.genesis();
    const data = 'mined data';
    const minedBlock = Block.mineBlock({ lastBlock, data });

    it('returns a Block instance', () => {
      expect(minedBlock instanceof Block).toBe(true);
    });

    it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
      expect(minedBlock.lastHash).toEqual(lastBlock.hash);
    });

    it('sets the `data`', () => {
      expect(minedBlock.data).toEqual(data);
    });

    it('sets a `timestamp`', () => {
      expect(minedBlock.timestamp).not.toEqual(undefined);
    });

    it('creates a SHA-256 `hash` based on the proper inputs', () => {
      expect(minedBlock.hash)
        .toEqual(
          cryptoHash(
            minedBlock.timestamp,
            minedBlock.nonce,
            minedBlock.difficulty,
            lastBlock.hash,
            data
          )
        );
    });

    it('sets a `hash` that matches the difficulty criteria', () => {
      expect(hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty))
        .toEqual('0'.repeat(minedBlock.difficulty));          //returns a string that contains the given string('0') repeated n times.
    });

    it('adjusts the difficulty correctly', () => {
      const possibleResults = [lastBlock.difficulty+1, lastBlock.difficulty-1];

      expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
    });
  });

  describe('adjustDifficulty()', () => {
    it('raises the difficulty for a quickly mined block', () => {
      expect(Block.adjustDifficulty({
        originalBlock: block,
        timestamp: block.timestamp + MINE_RATE - 100
      })).toEqual(block.difficulty+1);
    });
    it('lowers the difficulty for a slowly mined block', () => {
      expect(Block.adjustDifficulty({
        originalBlock: block,
        newTimestamp: block.timestamp + MINE_RATE + 100
      })).toEqual(block.difficulty-1);
    });
    it('has a lower limit of 1', () => {
      block.difficulty = -1;

      expect(Block.adjustDifficulty({
        originalBlock: block
      })).toEqual(1);
    });
  });
});