import React, { Component } from 'react'; 
import { Button } from 'react-bootstrap';
import Transaction from './Transaction';
 

class Block extends Component{
    state = { displayTransaction: false };

    toggleTransaction = () => {
        this.setState({ displayTransaction : !this.state.displayTransaction });
    }

    get displayTransaction() {                              //get -> different from `function` (where logic is computed each time when called)
                                                            //here the logic is computed only once and returns the same React object during each call.
        const { data } = this.props.block; 

        const stringifiedData = JSON.stringify(data);
        const dataDisplay = stringifiedData.length > 35 ? `${stringifiedData.substring(0,35)}...` : stringifiedData;

        if(this.state.displayTransaction){
            return(
                <div> 
                    <div>
                        {
                            data.map(transaction => (
                               <div key={transaction.id}>
                                   <hr />
                                   <Transaction transaction={transaction}/>
                                </div> 
                                )
                            )
                        }
                    </div>
                    <br />
                    <Button 
                        bsStyle="danger"
                        bsStyle="small"
                        onClick={this.toggleTransaction}
                    >
                        Show Less
                    </Button>
                </div> 
            );
        }

        return(
            <div>
                <div>Data: {dataDisplay}</div>
                <br />
                <Button
                    bsStyle="danger"
                    bsSize="small"
                    onClick={this.toggleTransaction}
                >
                    Show More
                </Button>
            </div>
        );
    }

    render() {
        const { timestamp, hash } = this.props.block;      //to fetch the info of `request made by parent component`(Blocks)

        const hashDisplay = hash.length > 15 ? `${hash.substring(0, 15)}...` : hash;

        return (
            <div className="Block">
                <div>Hash: {hashDisplay}</div>
                <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
                {this.displayTransaction}
            </div>
        )
    }
}

export default Block;