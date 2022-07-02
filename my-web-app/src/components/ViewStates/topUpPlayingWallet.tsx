import { useEffect } from 'react';
import { useWallet } from '../../react-contexts/wallet-context';



function TopUpPlayingWallet() {
    const { wallet, balance, refetch } = useWallet();

    useEffect(() => {
        let timeoutLink: NodeJS.Timeout;

        async function check() {
            console.log('checking...', { balance });
            if (balance === '0') {
                await refetch();
                timeoutLink = setTimeout(() => {
                    check();
                }, 10000)
            }
        }

        check();

        return () => {
            clearTimeout(timeoutLink);
        };
    }, [refetch, balance])

    return (
        <div className="top-up-playing-wallet-state">
            <div>
                To start top up balance of your Playing Wallet
            </div>

            <h1>
                {wallet?.walletAddress}
            </h1>
        </div>
    );
}

export default TopUpPlayingWallet;
