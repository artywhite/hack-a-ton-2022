import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { WalletV3ContractR2 } from 'tonweb/dist/types/contract/wallet/v3/wallet-v3-contract-r2';
import { getBalance, getWallet } from '../ton/wallet';

const WalletContext = React.createContext({});

interface WalletProviderProps {
    children: ReactNode;
};

export interface IWalletWrapper {
    wallet: WalletV3ContractR2;
    keyPair: nacl.SignKeyPair;
    walletAddress: string;
}

interface IWalletContext {
    wallet: IWalletWrapper,
    balance: string;
    refetch: () => void;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const [wallet, setWallet] = useState<IWalletContext['wallet'] | {}>({});
    const [balance, setBalance] = useState<string>('');

    const fetchData = async () => {
        const wallet = await getWallet();
        const balance = await getBalance(wallet.walletAddress);
        console.log({ wallet, balance });

        setWallet(wallet);
        setBalance(balance);

        return { wallet, balance };
    }

    useEffect(() => {
        fetchData();
    }, []);

    const providerValue = useMemo(() => {
        return {
            wallet, balance, refetch: fetchData
        }
    }, [balance]); // beware of infinite loop here

    return <WalletContext.Provider value={providerValue}>{children}</WalletContext.Provider>
}

export function useWallet() {
    const context = React.useContext(WalletContext);

    return context as IWalletContext; // quick hack :(
}

export default WalletContext;