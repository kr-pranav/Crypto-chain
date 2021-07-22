import React, { Component } from 'react';
import { FormGroup, FormControl, Button } from 'react-bootstrap'; 
import { Link } from 'react-router-dom';
import history from '../history';

class ConductTransaction extends Component{
    state = { recipient: '', amount: 0, knownAddresses: [] };

    componentDidMount() {
        fetch(`${document.location.origin}/api/known-addresses`)
          .then(response => response.json())
            .then(json => this.setState({ knownAddresses: json }));
    }

    updateRecipient = event => {                              //event -> based on onChange functionality here    
        this.setState({ recipient: event.target.value });
    }

    updateAmount = event => {
        this.setState({ amount: Number(event.target.value) });   //`event.target.value` is a string by default
    }

    conductTransaction = () => {
        const { recipient, amount } = this.state;

        fetch(`${document.location,origin}/api/transact`, {
            method:'POST',
            headers: { 'Content-Type' : 'application/json' },
            body: JSON.stringify({ recipient, amount })
        }).then(response => response.json())
            .then(json => {
                alert(json.message || json.type);               //if error message is undefined return type(success)
                history.push('/transaction-pool');              //after the alert, pushes the user to Transaction Pool page automatically
            });
    }

    render() {
        //console.log('this.state', this.state);

        return(
            <div className='ConductTransaction'>
                <Link to='/'>Home</Link>
                <h2>Conduct New Transaction</h2>
                <br />
                <h4>Fill in Transaction details</h4>
                <br />
                <FormGroup>
                    <FormControl
                        input='text'
                        placeholder='recipient'
                        value={this.state.recipient}
                        onChange={this.updateRecipient}     //sets the state newly for every change(type) in input field
                    />
                </FormGroup>
                <FormGroup>
                    <FormControl
                        input='number'
                        placeholder='amount'
                        value={this.state.amount}
                        onChange={this.updateAmount}     //sets the state newly for every change(type) in input field
                    />
                </FormGroup>
                <br />
                <div>
                    <Button
                        bsStyle="danger"
                        onClick={this.conductTransaction}
                    >
                        Submit
                    </Button>
                </div>
                <br />
                <hr />
                <br />
                <h4>Known Wallet Address</h4>
                {
                    this.state.knownAddresses.map( knownAddress => {
                        return (
                            <div className="KnownAddress">
                                <div key={knownAddress}>
                                    <div>{knownAddress}</div>
                                    <br />
                                </div>
                            </div>
                        );
                    })
                }
                <br />

            </div>
        );
    }
};

export default ConductTransaction;