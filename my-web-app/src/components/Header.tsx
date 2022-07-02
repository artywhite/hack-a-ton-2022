import { useWallet } from "../react-contexts/wallet-context";
import { TonWebUtils } from "../ton/common";

function Header() {
    const { wallet, balance } = useWallet();
    const addressShort = wallet.walletAddress ? wallet.walletAddress.slice(0, 6) + '...' + wallet.walletAddress.slice(-6) : '';

    return (
        <header className="app-header">
            <div className="app-wallet-state">
                <div className="wallet-address">
                    Address: {addressShort}
                </div>
                <div className="wallet-balance">
                    Balance: {balance ? TonWebUtils.fromNano(balance) : ''} 💎
                </div>
            </div>
        </header>
    );
}

export default Header;
