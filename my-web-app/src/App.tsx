import './App.css';
import Header from './components/Header';
import ViewStateManager from './components/ViewStates/index';
import { WalletProvider } from './react-contexts/wallet-context';

function App() {
    return (
        <WalletProvider>
            <div className="app">
                <Header />

                <div className="main-content">
                    <ViewStateManager />
                </div>
            </div>
        </WalletProvider>
    );
}

export default App;
