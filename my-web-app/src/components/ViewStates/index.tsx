import { ReactNode, useEffect, useState } from "react";
import { useWallet } from "../../react-contexts/wallet-context";
import { TonWebUtils } from "../../ton/common";
import { APP_EVENTS } from "../../types";
import MyWebSocket from "../../utils/ws";
import './index.css';


import TopUpPlayingWallet from "./topUpPlayingWallet";
import WaitingForPlayer from "./waitingForPlayer";

enum ViewStates {
    LOADING,
    TOP_UP_PLAYING_WALLET,
    WAITING_FOR_PLAYER,
}

function ViewStateManager() {
    const { balance, wallet } = useWallet();
    const [viewState, setViewState] = useState(ViewStates.LOADING);
    let ViewStateComponent: ReactNode = <></>;

    useEffect(() => {
        const onRoundPrepare = () => { };
        MyWebSocket.subscribe(APP_EVENTS.ROUND_PREPARE, onRoundPrepare)

        return () => {
            MyWebSocket.unsubscribeAll();
        }
    }, []);

    useEffect(() => {
        if (balance && balance !== '0') {
            setViewState(ViewStates.WAITING_FOR_PLAYER);
            MyWebSocket.send(APP_EVENTS.WAITING_FOR_PLAYER, {
                walletAddress: wallet.walletAddress,
                publicKey: TonWebUtils.bytesToHex(wallet.keyPair.publicKey)
            })
        }
    }, [balance]);

    switch (viewState) {
        case ViewStates.LOADING: {
            ViewStateComponent = <h4>Loading...</h4>;
            break;
        }
        case ViewStates.TOP_UP_PLAYING_WALLET: {
            ViewStateComponent = <TopUpPlayingWallet />;
            break;
        }

        case ViewStates.WAITING_FOR_PLAYER: {
            ViewStateComponent = <WaitingForPlayer />;
            break;
        }
    }

    return (
        <div className="view-state-manager">
            {ViewStateComponent}
        </div>
    )
}

export default ViewStateManager;
