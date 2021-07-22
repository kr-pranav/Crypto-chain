const redis = require('redis');
const Transaction = require('../wallet/transaction');

const CHANNELS ={
    TEST : 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

class PubSub{
    constructor({ blockchain, transactionPool }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;

        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();

        this.subscribeToChannel();


        this.subscriber.on('message', (channel, message) => {
            this.handleMesaage(channel, message);
        });
    }

    handleMesaage(channel, message) {
        console.log(`Message Received.   Channel:${channel}.   Message:${message}.`);

         const parsedMessage = JSON.parse(message);     //to convert strings into JavaScript objects.x
        
         switch(channel){
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain( parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({      //we should not clear all the transactions from peer's transactionPool
                        chain: parsedMessage                                //only those which are recorded in the replaced blockchain should be cleared.           
                    });
                });
                break;

            case CHANNELS.TRANSACTION:
                this.transactionPool.setTransaction(parsedMessage);
                break;

            default:
                return;
         }
    }

    subscribeToChannel() {
        Object.values(CHANNELS).forEach((channel) => {
            this.subscriber.subscribe(channel);
        });
    }

    publish({ channel, message}) {
        
        //this.publisher.publish(channel, message);
        
        //setTimeout( () => {                         //to handle the scenario where broadcasts are done too fast i.e, many blocks are mined too quickly.
            this.subscriber.unsubscribe(channel, () => {
                this.publisher.publish(channel, message, () => {
                    this.subscriber.subscribe(channel);
                });
            });
        //}, 1000);  
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)      //send the whole chain as a single string
        });
    }

    broadcastTransaction(transaction) {
        this.publish({
           channel: CHANNELS.TRANSACTION,
           message: JSON.stringify(transaction)                 //message to server should be in string format
        })
    }
}

/* testing code
const testPubsub = new PubSub();

setTimeout( () => testPubsub.publisher.publish(CHANNELS.TEST, 'foo'), 1000);
*/

module.exports = PubSub ;