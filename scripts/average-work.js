const Blockchain = require('../blockchain');

const blockchain = new Blockchain();

blockchain.addBlock({ data: ' initial-data' });
console.log('first block structure', blockchain.chain[blockchain.chain.length-1]);  //to verify whether it still prints `hash` in hexa-decimal form.

let prevTimestamp, nextTimestamp, nextBlock, timeDiff, average;

const times = [];

for(let i=0; i<100; i++){
    prevTimestamp = blockchain.chain[blockchain.chain.length-1].timestamp;

    blockchain.addBlock({ data: `block number ${i}`});
    nextBlock = blockchain.chain[blockchain.chain.length-1];
    nextTimestamp = nextBlock.timestamp;

    timeDiff = nextTimestamp - prevTimestamp;
    times.push(timeDiff);

    average = times.reduce((total, num) => (total+num))/100;

    console.log(`time to mine block: ${nextTimestamp}, difficulty: ${nextBlock.difficulty}, average time: ${average}ms`);
}