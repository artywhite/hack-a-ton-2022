import { ReactNode, useEffect, useState } from "react";
import { useWallet } from "../../react-contexts/wallet-context";
import { TonWebUtils } from "../../ton/common";
import { APP_EVENTS } from "../../types";
import MyWebSocket, { SubscriptionType } from "../../utils/ws";
import "./index.css";

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
    const [isWsConnected, setWsConnected] = useState(false);

    let ViewStateComponent: ReactNode = <></>;

    useEffect(() => {
        const onRoundPrepare = () => {
            console.log("ROUND PREPARE");
        };

        MyWebSocket.subscribe(APP_EVENTS.ROUND_PREPARE, onRoundPrepare);

        return () => {
            MyWebSocket.unsubscribeAll();
        };
    }, []);

    useEffect(() => {
        if (wallet?.walletAddress) {
            MyWebSocket.connect();

            const onConnected = () => {
                setWsConnected(true);
                setViewState(ViewStates.TOP_UP_PLAYING_WALLET);
            };
            const onDisconnected = () => setWsConnected(false);

            MyWebSocket.subscribe(SubscriptionType.CONNECT, onConnected);
            MyWebSocket.subscribe(SubscriptionType.DISCONNECT, onDisconnected);

            return () => {
                MyWebSocket.unsubscribe(SubscriptionType.CONNECT, onConnected);
                MyWebSocket.unsubscribe(SubscriptionType.DISCONNECT, onDisconnected);
            };
        }
    }, [wallet?.walletAddress]);

    useEffect(() => {
        if (balance && balance !== "0" && isWsConnected) {
            setViewState(ViewStates.WAITING_FOR_PLAYER);

            MyWebSocket.send(APP_EVENTS.WAITING_FOR_PLAYER, {
                walletAddress: wallet.walletAddress,
                publicKey: TonWebUtils.bytesToHex(wallet.keyPair.publicKey),
            });
        }
    }, [balance, isWsConnected]);

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

    return <div className="view-state-manager">{ViewStateComponent}</div>;
}

export default ViewStateManager;
