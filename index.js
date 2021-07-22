const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool });
const transactionMiner = new TransactionMiner({
    blockchain,
    transactionPool,
    wallet,
    pubsub
});

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

//setTimeout( () => pubsub.broadcastChain(), 1000);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));        //to serve many files from a particular directory

app.get('/api/blocks', (req, res) =>{
    res.json(blockchain.chain);
});

app.get('/api/blocks/length', (req,res) => {
    res.json(blockchain.chain.length);
});

app.get('/api/blocks/:id', (req, res) => {
    const { id } = req.params;
    const { length } = blockchain.chain;

    const blocksRevresed = blockchain.chain.slice().reverse();      //inorder to make a copy and reverse. Don't disturb the original blockchain.

    let startIndex = (id-1) * 5;
    let endIndex = id * 5;

    startIndex = startIndex < length ? startIndex : length;
    endIndex = endIndex < length ? endIndex : length;

    res.json(blocksRevresed.slice(startIndex,endIndex));
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock({ data });

    pubsub.broadcastChain();

    res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;

    /* already checked in createTransaction() method. So it is enough if we try and catch that error.
    if(amount > wallet.balance){
        res.json('Amount exceeds the existing balance');
    }
    */

    let transaction = transactionPool.existingTransaction({ walletAddress: wallet.publicKey });

    try{
        if( ! transaction){     //if transaction does not exist already
            transaction = wallet.createTransaction({ amount, recipient, chain: blockchain.chain });
        }
        else{                   //if exists
            transaction.updateTransaction({ senderWallet:wallet, newAmount:amount, newRecipient:recipient});
        }
    }catch(error) {
        return res.status(400).json({ type:'error', message: error.message });
    }

    transactionPool.setTransaction(transaction);

    //console.log('displaying transactinPool', transactionPool);    //we have designed a separate api request to view the current transactionPool-Map

    pubsub.broadcastTransaction(transaction);

    res.json({ type:'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();
  
    res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;
  
    res.json({
      address,
      balance: Wallet.calculateBalance({ chain: blockchain.chain, reqWalletAddress: address })
    });
  });

app.get('/api/known-addresses', (req, res) => {
    const addressMap = {};

    for(let block of blockchain.chain){
        for(let transaction of block.data){
            const recipients = Object.keys(transaction.outputMap);

            recipients.forEach( recipient => addressMap[recipient] = recipient);
        }
    }

    res.json(Object.keys(addressMap));
});

app.get('*', (req, res) => {                                        //any endpoint will lead to this request (other than above mentioned ones)
    res.sendFile( path.join(__dirname, 'client/dist/index.html') );    //to give the absolute path of index.html file
});



const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) =>{
        if(!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);

            if(rootChain.length > blockchain.chain.length){     //to ensure that rootChain is longer 
                console.log('replacing new chain on a sync with rootChain', rootChain);     //this will log anyway, even if new peer's chain is not replaced. Here we are putting it because new peer will anyway be smaller than rootChain and get replaced for sure.
                                                                                            //if we actually want to find whether it got replced or not, we should look for logged message from the replaceChain() method.
                blockchain.replaceChain(rootChain);

                wallet.balance = Wallet.calculateBalance({                                  //setting correct initial balance for new-peer
                    chain: blockchain.chain,
                    reqWalletAddress: wallet.publicKey
                });
            }
        }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`}, (error, response, body) =>{
        if(!error && response.statusCode === 200) {
            const rootTransactionMap = JSON.parse(body);

            console.log('replacing new transaction-pool-map on a sync with rootTransactionMap', rootTransactionMap);

            transactionPool.replaceTransactionMap(rootTransactionMap);
        }
    });
};
 

//Seeding backend with some data to check front-end Display
const walletOne = new Wallet();
const walletTwo = new Wallet();

const generateWalletTransaction = ({ wallet, recipient, amount }) => {
    const transaction = wallet.createTransaction({
        recipient, amount, chain: blockchain.chain
    });

    transactionPool.setTransaction(transaction);
};

const localWalletAction = () => generateWalletTransaction({
    wallet: wallet, recipient: walletOne.publicKey, amount: 10
});

const walletOneAction = () => generateWalletTransaction({
    wallet: walletOne, recipient: walletTwo.publicKey, amount: 20
});

const walletTwoAction = () => generateWalletTransaction({
    wallet: walletTwo, recipient: wallet.publicKey, amount: 30
});

for(let i=0; i<10; i++){
    if( i%3 === 0){
        localWalletAction();
        walletOneAction();
    }
    else if( i%3 === 1){
        localWalletAction();
        walletTwoAction();
    }
    else{
        walletOneAction();
        walletTwoAction();
    }

    transactionMiner.mineTransactions();        //mine a block with 2 transactions created in each iteration.
}


let PEER_PORT;

if(process.env.GENERATE_PEER_PORT === 'true'){
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
} 

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => { 
    console.log(`listening to localhost: ${PORT}`); 

    if(PORT !== DEFAULT_PORT){
        syncWithRootState();
    }
});