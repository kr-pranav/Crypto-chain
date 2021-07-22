import React, { Component } from 'react';           //secondary export -> { }
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

class App extends Component{
    state =  { walletInfo: { } };
    
    componentDidMount() {
        fetch(`${document.location,origin}/api/wallet-info`)
          .then( response => response.json())
            .then( json => this.setState({walletInfo: json}) );
    }

    render() {
        const  { address, balance } = this.state.walletInfo;    //depends on the state - so render() is fired again once the state gets changed.

        return (
            <div className="App"> 
                <h1>
                    Welcome to the blockchain...
                </h1>
                <img className='logo' src={logo}></img>
                <h3>Wallet Details</h3>
                <div className="WalletInfo">
                    <div className="Block">Wallet Address : {address}</div>
                    <div className="Block">Current Balance : {balance}</div>
                </div>
                <br />
                <br />
                <div>
                    <Link to='/blocks'>See Blockchain</Link>
                    <br />
                    <Link to='/conduct-transaction'>Conduct new transaction</Link>
                    <br />
                    <Link to='/transaction-pool'>See transaction pool</Link>
                    <br />
                </div>
                <br />
                <br />
            </div>
        );
    }
}

export default App;