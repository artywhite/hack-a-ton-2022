import { ReactNode, useEffect, useState } from "react";
import { useWallet } from "../../react-contexts/wallet-context";
import { TonWebUtils } from "../../ton/common";
import { getPaymentChannel } from "../../ton/payment-channel";
import { APP_EVENTS } from "../../types";
import MyWebSocket, { SubscriptionType } from "../../utils/ws";
import Game, { IChallengePayload, IGameState } from "./game";
import GameOver from "./game-over";
import "./index.css";

import TopUpPlayingWallet from "./topUpPlayingWallet";
import WaitingForPlayer from "./waitingForPlayer";

enum ViewStates {
    LOADING,
    TOP_UP_PLAYING_WALLET,
    WAITING_FOR_PLAYER,
    GAME,
    GAME_OVER,
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

interface ClientCredentials {
    walletAddress: string;
    publicKey: string; // hex format
}

interface RoundPreparePayload {
    gameId: string;
    playersCredentials: {
        playerOne: ClientCredentials;
        playerTwo: ClientCredentials;
    };
}

interface IClientStateSync {
    state: ClientState;
    challenges: Array<{
        id: string;
        exampleString: string;
        answers: number[];
        isActive?: boolean;
    }>;
    game?: {
        gameId: string;
        currentPlayer: 1 | 2;
        playerOnePoint: number;
        playerTwoPoint: number;
    };
    playersCredentials: {
        playerOne: ClientCredentials;
        playerTwo: ClientCredentials;
    };
}

function ViewStateManager() {
    const { balance, wallet } = useWallet();
    const [viewState, setViewState] = useState(ViewStates.LOADING);
    const [gameState, setGameState] = useState<IGameState>();
    const [gameOverState, setGameOverState] = useState<IGameState>();
    const [challenges, setChallenges] = useState<IChallengePayload[]>([]);
    const [isWsConnected, setWsConnected] = useState(false);
    const [paymentChannel, setPaymentChannel] = useState();
    const [myPaymentChannelAddress, setMyPaymentChannelAddress] = useState("");

    let ViewStateComponent: ReactNode = <></>;

    useEffect(() => {
        const onRoundPrepare = (payload: RoundPreparePayload) => {
            console.log("ROUND_PREPARE", payload);
            const {
                playersCredentials: { playerOne, playerTwo },
            } = payload;
            const isPlayerOne = playerOne.walletAddress === wallet.walletAddress;

            getPaymentChannel({
                myKeyPair: wallet.keyPair,
                publicKeyA: playerOne.publicKey,
                publicKeyB: playerTwo.publicKey,
                isA: isPlayerOne,
            }).then(async (paymentChannel) => {
                setPaymentChannel(paymentChannel);

                if (!isPlayerOne) {
                    const paymentChannelAddress = await paymentChannel.getAddress();
                    MyWebSocket.send(APP_EVENTS.CHANNEL_CREATED, { paymentChannelAddress });
                }
            });
        };

        const onRoundStart = () => {
            console.log("ROUND_START");

            setViewState(ViewStates.GAME);
        };

        const onStateSync = async (payload: IClientStateSync) => {
            console.log("STATE_SYNC", payload);
            const {
                state,
                game,
                challenges = [],
                playersCredentials: { playerOne, playerTwo },
            } = payload;
            const isPlayerOne = playerOne.walletAddress === wallet.walletAddress;
            const paymentChannel = await getPaymentChannel({
                myKeyPair: wallet.keyPair,
                publicKeyA: playerOne.publicKey,
                publicKeyB: playerTwo.publicKey,
                isA: isPlayerOne,
            });
            setPaymentChannel(paymentChannel);
            const paymentChannelAddress = await (await paymentChannel.getAddress()).toString(true, true, true);
            setMyPaymentChannelAddress(paymentChannelAddress);

            if (state === ClientState.InGame) {
                setViewState(ViewStates.GAME);
                setGameState(game);
                setChallenges(challenges.reverse());
            }

            if (state === ClientState.WaitingGame) {
                if (!isPlayerOne) {
                    MyWebSocket.send(APP_EVENTS.CHANNEL_CREATED, { paymentChannelAddress });
                }
            }
        };

        // will listen only A
        const onChannelCreated = async (payload: any) => {
            const { paymentChannelAddress } = payload;
            const isChannelAddressSame = paymentChannelAddress === myPaymentChannelAddress;

            if (!isChannelAddressSame) {
                throw new Error("Channels addresses are not same");
            }

            MyWebSocket.send(APP_EVENTS.CHANNEL_VERIFIED, {});

            // @ts-ignore
            const fromMyWallet = paymentChannel.fromWallet({
                wallet: wallet.wallet,
                secretKey: wallet.keyPair.secretKey,
            });

            // @ts-ignore
            const { balanceA, balanceB } = await paymentChannel.getData();
            console.log({ balanceB: balanceB.toString(), balanceA: balanceA.toString() });

            // @ts-ignore
            const channelState = await paymentChannel.getChannelState();
            console.log({ channelState });

            // TOP UP A and init
            if (channelState === 0) {
                await fromMyWallet.deploy().send(TonWebUtils.toNano("0.05"));

                if (balanceA.toString() === "0") {
                    const initBalance = TonWebUtils.toNano("0.1");
                    await fromMyWallet
                        .topUp({ coinsA: initBalance, coinsB: new TonWebUtils.BN(0) })
                        .send(initBalance.add(TonWebUtils.toNano("0.05"))); // +0.05 TON to network fees
                }

                const channelInitState = {
                    balanceA, // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
                    balanceB, // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
                    seqnoA: new TonWebUtils.BN(0), // initially 0
                    seqnoB: new TonWebUtils.BN(0), // initially 0
                };

                await fromMyWallet.init(channelInitState).send(TonWebUtils.toNano("0.05"));
            }

            // A says: I'm READY!
            if (channelState === 1) {
                MyWebSocket.send(APP_EVENTS.PLAYER_READY, {});
            }
        };

        // will listen only B
        const onChannelVerified = async () => {
            console.log("onChannelVerified");
            // top up wallet b

            // @ts-ignore
            const channelState = await paymentChannel.getChannelState();

            // TOP UP B
            if (channelState === 0) {
                // @ts-ignore
                const fromMyWallet = paymentChannel.fromWallet({
                    wallet: wallet.wallet,
                    secretKey: wallet.keyPair.secretKey,
                });

                // @ts-ignore
                const { balanceA, balanceB } = await paymentChannel.getData();
                console.log({ balanceB: balanceB.toString(), balanceA: balanceA.toString() });
                if (balanceB.toString() === "0") {
                    const initBalance = TonWebUtils.toNano("0.1");
                    await fromMyWallet
                        .topUp({ coinsA: new TonWebUtils.BN(0), coinsB: initBalance })
                        .send(initBalance.add(TonWebUtils.toNano("0.05"))); // +0.05 TON to network fees
                }
            }

            if (channelState === 1) {
                // B says: I'm READY!
                MyWebSocket.send(APP_EVENTS.PLAYER_READY, {});
            }
        };

        const onGameEnd = async (payload: IGameState) => {
            setViewState(ViewStates.GAME_OVER);
            setGameOverState(payload);
        };

        MyWebSocket.subscribe(APP_EVENTS.ROUND_END, onGameEnd);
        MyWebSocket.subscribe(APP_EVENTS.STATE_SYNC, onStateSync);
        MyWebSocket.subscribe(APP_EVENTS.ROUND_PREPARE, onRoundPrepare);
        MyWebSocket.subscribe(APP_EVENTS.ROUND_START, onRoundStart);
        MyWebSocket.subscribe(APP_EVENTS.CHANNEL_CREATED, onChannelCreated);
        MyWebSocket.subscribe(APP_EVENTS.CHANNEL_VERIFIED, onChannelVerified);

        return () => {
            MyWebSocket.unsubscribeAll();
        };
    }, [wallet, myPaymentChannelAddress]);

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
        if (viewState === ViewStates.TOP_UP_PLAYING_WALLET && balance && balance !== "0" && isWsConnected) {
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
            ViewStateComponent = <Game game={gameState} challenges={challenges} paymentChannel={paymentChannel} />;
            break;
        }

        case ViewStates.GAME_OVER: {
            ViewStateComponent = <GameOver state={gameOverState} />;
            break;
        }
    }

    return <div className="view-state-manager">{ViewStateComponent}</div>;
}

export default ViewStateManager;
