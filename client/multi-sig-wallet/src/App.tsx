import React from 'react';
import { Message, Button } from 'semantic-ui-react';
import logo from './logo.svg';
import './App.css';

function App() {
  const account = "0x123654";


  return (
    <div className="App">
      <header className="App-header">
        <h1>Multi Sig Wallet</h1>
        <div>Account: {account}</div>

        <Message warning>Metamask is not connected</Message>
        <Button
          color="green"
        >
          Connect to Metamask
        </Button>
      </header>
    </div>
  );
}

export default App;
