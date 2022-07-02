import React, { useEffect, useState } from 'react';
import './App.css';
import ViewStateManager from './components/ViewStates/index';
import { getBalance, getWallet } from './ton/helpers/wallet';

function App() {
    const [balance, setBalance] = useState('');
    const [address, setAddress] = useState('');

    const addressShort = address.slice(0, 6) + '...' + address.slice(-6);

    useEffect(() => {
        const fetchData = async () => {
            const wallet = await getWallet();
            const balance = await getBalance(wallet.walletAddress);
            console.log({ wallet, balance });
            setAddress(wallet.walletAddress);
            setBalance(balance);
        }


        fetchData();
    }, []);

    return (
        <div className="app">
            <header className="app-header">
                <div className="app-wallet-state">
                    <div className="wallet-address">
                        Address: {addressShort}
                    </div>
                    <div className="wallet-balance">
                        Balance: {balance}
                    </div>
                </div>
            </header>

            <ViewStateManager />
        </div>
    );
}

export default App;
