import { ReactNode, useEffect, useState } from "react";
import { useWallet } from "../../react-contexts/wallet-context";
import { TonWebUtils } from "../../ton/common";
import { APP_EVENTS } from "../../types";
import MyWebSocket, { SubscriptionType } from "../../utils/ws";
import Game from "./game";
import "./index.css";

import TopUpPlayingWallet from "./topUpPlayingWallet";
import WaitingForPlayer from "./waitingForPlayer";

enum ViewStates {
    LOADING,
    TOP_UP_PLAYING_WALLET,
    WAITING_FOR_PLAYER,
    GAME,
}

export enum ClientState {
    // Client connected, but not activated
    Frozen = "Frozen",
    // Activated and ready to game
    Pending = "Pending",
    // Waiting to start game
    WaitingGame = "WaitingGame",

    ReadyToGame = "ReadyToGame",

    InGame = "InGame",
}

interface IClientStateSync {
    state: ClientState;
    challenges: Array<{
        id: string;
        exampleString: string;
        asnwers?: number[];
        isActive?: boolean;
    }>;
    game?: {
        currentPlayer: 1 | 2;
        playerOnePoint: number;
        playerTwoPoint: number;
    };
}

function ViewStateManager() {
    const { balance, wallet } = useWallet();
    const [viewState, setViewState] = useState(ViewStates.LOADING);
    const [isWsConnected, setWsConnected] = useState(false);

    let ViewStateComponent: ReactNode = <></>;

    useEffect(() => {
        const onRoundPrepare = () => {
            console.log("ROUND_PREPARE");

            // Тут пока опускаем все что касается payemnt chanel и соответвующих проверок
            setTimeout(() => {
                MyWebSocket.send(APP_EVENTS.PLAYER_READY, {});
            }, Math.floor(Math.random() * 3000) + 500);
        };

        const onRoundStart = () => {
            console.log("ROUND_START");

            setViewState(ViewStates.GAME);
        };

        const stateSync = (payload: IClientStateSync) => {
            console.log("STATE_SYNC", payload);

            // Тут надо обработать восстановление состояния
        };

        MyWebSocket.subscribe(APP_EVENTS.STATE_SYNC, stateSync);
        MyWebSocket.subscribe(APP_EVENTS.ROUND_PREPARE, onRoundPrepare);
        MyWebSocket.subscribe(APP_EVENTS.ROUND_START, onRoundStart);

        return () => {
            MyWebSocket.unsubscribeAll();
        };
    }, []);

    useEffect(() => {
        if (wallet?.walletAddress) {
            MyWebSocket.init(wallet?.walletAddress);
            MyWebSocket.connect();

            const onConnected = () => {
                setWsConnected(true);
                setViewState((state) => (state === ViewStates.LOADING ? ViewStates.TOP_UP_PLAYING_WALLET : state));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        case ViewStates.GAME: {
            ViewStateComponent = <Game />;
            break;
        }
    }

    return <div className="view-state-manager">{ViewStateComponent}</div>;
}

export default ViewStateManager;
