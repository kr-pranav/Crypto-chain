import React, { Component } from 'react';
import Transaction from './Transaction'; 
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import history from '../history';

const POLL_INTERVAL_MS = 10000;

class TransactionPool extends Component{
    state = { transactionPoolMap: {} };

    fetchMineTransactions = () => {
        if(Object.keys(this.state.transactionPoolMap).length!==0){
            fetch(`${document.location,origin}/api/mine-transactions`)
            .then(response => {
                if(response.status === 200){
                    alert('Successfully mined a block !');
                    history.push('/blocks');
                } else{
                    alert('Mine-transaction request failed !!');
                    history.push('/transaction-pool');
                }
            });
        }
        else{
            alert('There is no transaction in the transaction pool. Try again after sometime !!');
            history.push('/');
        }    
    }

    fetchTransactionPoolMap = () => {
        fetch(`${document.location,origin}/api/transaction-pool-map`)
          .then(response => response.json())
            .then(json => this.setState({ transactionPoolMap: json }));
    }

    componentDidMount() {
        this.fetchTransactionPoolMap();

        this.fetchPoolMapInterval = setInterval(
            () => this.fetchTransactionPoolMap(),
            POLL_INTERVAL_MS                        //refresh the transaction pool once in every 10 seconds.
        )
    }

    componentWillUnmount() {
        clearInterval(this.fetchPoolMapInterval);   //unsets the inetrval
    }

    render(){
       return(
           <div className='TransactionPool'>
                <Link to='/'>Home</Link>
                <h3>Transaction Pool</h3>
                {
                    Object.values(this.state.transactionPoolMap).map(transaction => (
                        <div key={transaction.id}>
                            <hr />
                            <Transaction transaction={transaction} />
                        </div>
                        ) 
                    )
                }
                <hr />
                <Button 
                    bsStyle="danger"
                    onClick={this.fetchMineTransactions}
                >
                    Mine Transactions
                </Button>
           </div>
       ) 
    }
};

export default TransactionPool;