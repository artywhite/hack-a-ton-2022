import { useCallback, useEffect, useState } from "react";
import { TonWebUtils } from "../../ton/common";

import { APP_EVENTS } from "../../types";
import MyWebSocket from "../../utils/ws";
import { ChallengeRow } from "../Challenge";

export enum ChallengeType {
    InProgress = 1,
    Right,
    Wrong,
}

export interface IChallengePayload {
    id: string;
    exampleString: string;
    answers: number[];
    type?: ChallengeType;
}

export interface IChallengeEndResult {
    id: string;
    isRight: boolean;
}

export interface IGameState {
    playerOnePoint: number;
    playerTwoPoint: number;
    currentPlayer: 1 | 2;
}

interface ITimeLeft {
    timeLeft?: number;
}

interface IGameProps {
    challenges: IChallengePayload[];
    game?: IGameState;
    paymentChannel?: any; // no typings :(
}

const incrementBN = (bn: any) => bn.add(new TonWebUtils.BN(1));
const increment1000BN = (bn: any) => bn.add(new TonWebUtils.BN(1000));
const decrement1000BN = (bn: any) => bn.sub(new TonWebUtils.BN(1000));
const channelStateToJSON = (state: any) => {
    return {
        balanceA: state.balanceA.toJSON(),
        balanceB: state.balanceB.toJSON(),
        seqnoA: state.seqnoA.toJSON(),
        seqnoB: state.seqnoB.toJSON(),
    };
}
const channelStateFromJSON = (state: any) => {
    return {
        balanceA: new TonWebUtils.BN(state.balanceA, 16),
        balanceB: new TonWebUtils.BN(state.balanceB, 16),
        seqnoA: new TonWebUtils.BN(state.seqnoA, 16),
        seqnoB: new TonWebUtils.BN(state.seqnoB, 16),
    };
}

function Game(props: IGameProps) {
    const { challenges: initChallenges = [], game: initGameState, paymentChannel } = props;
    const [timeLeft, setTimeLeft] = useState<number>();

    const [gameState, setGameState] = useState<IGameState | undefined>(initGameState);
    const [challenges, setChallenges] = useState<IChallengePayload[]>(initChallenges);
    const [paymentChannelData, setPaymentChannelData] = useState(() => {
        if (localStorage.getItem('latestChannelData')) {
            // @ts-ignore
            return channelStateFromJSON(JSON.parse(localStorage.getItem('latestChannelData')));
        }
        return paymentChannel.getData();
    });

    useEffect(() => {
        // const updateBalances = async function () {
        //     paymentChannel.getData().then((data: any) => {
        //         setPaymentChannelData(data);
        //     });
        // }

        const onChallengeStart = (payload: IChallengePayload) => {
            setChallenges((current) => [{ ...payload, type: ChallengeType.InProgress }, ...current]);
        };

        const onChallengeEnd = async (payload: IChallengeEndResult) => {
            const isPlayerAnswerCorrect = payload.isRight;

            console.log('onChallengeEnd', paymentChannel);

            setChallenges((current) =>
                current.map((challenge) =>
                    challenge.id === payload.id
                        ? {
                            ...challenge,
                            type: isPlayerAnswerCorrect ? ChallengeType.Right : ChallengeType.Wrong,
                        }
                        : challenge,
                ),
            );

            if (isPlayerAnswerCorrect) {
                let latestChannelData = await paymentChannel.getData();
                if (localStorage.getItem('latestChannelData')) {
                    // @ts-ignore
                    latestChannelData = channelStateFromJSON(JSON.parse(localStorage.getItem('latestChannelData')));
                }

                const isA = gameState?.currentPlayer === 1;
                console.log('isPlayerAnswerCorrect', { isA, gameState });
                const newChannelState = {
                    // @ts-ignore
                    balanceA: isA ? increment1000BN(latestChannelData.balanceA) : decrement1000BN(latestChannelData.balanceA),
                    // @ts-ignore
                    balanceB: !isA ? increment1000BN(latestChannelData.balanceB) : decrement1000BN(latestChannelData.balanceB),
                    // @ts-ignore
                    seqnoA: isA ? incrementBN(latestChannelData.seqnoA) : latestChannelData.seqnoA,
                    // @ts-ignore
                    seqnoB: !isA ? incrementBN(latestChannelData.seqnoB) : latestChannelData.seqnoB
                };
                const signature = await paymentChannel.signState(newChannelState);
                const newChannelStateJSON = channelStateToJSON(newChannelState);

                console.log({ signature, newChannelStateJSON: newChannelStateJSON })

                MyWebSocket.send(APP_EVENTS.CHANNEL_STATE_UPDATE, {
                    newChannelStateJSON,
                    signatureHex: TonWebUtils.bytesToHex(signature),
                })
            }
        };

        const onGameStateUpdate = (payload: IGameState) => {
            setGameState(payload);
        };

        const onTimerLeft = (payload: ITimeLeft) => {
            setTimeLeft(payload.timeLeft);
        };

        const onChannelStateUpdate = async (payload: any) => {
            const { newChannelStateJSON, signatureHex } = payload;
            const newState = channelStateFromJSON(newChannelStateJSON);
            const signature = TonWebUtils.hexToBytes(signatureHex);
            const isStateValid = await paymentChannel.verifyState(newState, signature)

            if (!isStateValid) {
                throw new Error('Invalid State!');
            }

            setPaymentChannelData(newState);

            localStorage.setItem('latestChannelData', JSON.stringify(newChannelStateJSON));

            const mySignature = await paymentChannel.signState(newState);
            MyWebSocket.send(APP_EVENTS.CHANNEL_STATE_APPROVED, {
                signatureHex: TonWebUtils.bytesToHex(mySignature),
                newChannelStateJSON
            });
        }

        const onChannelStateApproved = (payload: any) => {
            const { newChannelStateJSON, signatureHex } = payload;

            setPaymentChannelData(channelStateFromJSON(newChannelStateJSON));

            console.log('onChannelStateApproved', payload);

            localStorage.setItem('latestChannelData', JSON.stringify(newChannelStateJSON));
        }

        MyWebSocket.subscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);
        MyWebSocket.subscribe(APP_EVENTS.CHALLENGE_END, onChallengeEnd);
        MyWebSocket.subscribe(APP_EVENTS.GAME_STATE_UPDATE, onGameStateUpdate);
        MyWebSocket.subscribe(APP_EVENTS.ROUND_TIMER, onTimerLeft);
        MyWebSocket.subscribe(APP_EVENTS.CHANNEL_STATE_UPDATE, onChannelStateUpdate);
        MyWebSocket.subscribe(APP_EVENTS.CHANNEL_STATE_APPROVED, onChannelStateApproved);

        // updateBalances();

        return () => {
            MyWebSocket.unsubscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);
            MyWebSocket.unsubscribe(APP_EVENTS.CHALLENGE_END, onChallengeEnd);
            MyWebSocket.unsubscribe(APP_EVENTS.GAME_STATE_UPDATE, onGameStateUpdate);
            MyWebSocket.unsubscribe(APP_EVENTS.ROUND_TIMER, onTimerLeft);
        };
    }, [paymentChannel]);

    const onAnswer = useCallback((answer: Number) => {
        MyWebSocket.send(APP_EVENTS.PLAYER_INPUT, {
            value: answer,
        });
    }, []);

    const myPoints = gameState?.currentPlayer === 1 ? gameState.playerOnePoint : gameState?.playerTwoPoint;
    const partnerPoints = gameState?.currentPlayer === 1 ? gameState.playerTwoPoint : gameState?.playerOnePoint;

    console.log('game render', { paymentChannelData });
    // @ts-ignore
    const { balanceA, balanceB } = paymentChannelData;
    const balanceANormalized = balanceA ? TonWebUtils.fromNano(balanceA).toString() : '';
    const balanceBNormalized = balanceB ? TonWebUtils.fromNano(balanceB).toString() : '';
    const isA = gameState?.currentPlayer === 1;

    return (
        <div>
            <h1>game started!</h1>

            {timeLeft && <h4>Time: {Math.floor(timeLeft / 1000)}</h4>}

            {gameState && (
                <h4>
                    {/* <p>
                        My game points: <b>{myPoints}</b>
                    </p>
                    <p>
                        Opponent's game points : <b>{partnerPoints}</b>
                    </p> */}
                    <p>
                        {isA ? 'My balance' : 'Opponent balance'}: {balanceANormalized}
                    </p>
                    <p>
                        {isA ? 'Opponent balance' : 'My balance'}: {balanceBNormalized}
                    </p>
                </h4>
            )}

            <div
                style={{
                    maxHeight: "400px",
                    overflow: "auto",
                }}
            >
                {challenges.map((challenge) => (
                    <ChallengeRow challenge={challenge} key={challenge.id} onAnswer={onAnswer} />
                ))}
            </div>
        </div>
    );
}

export default Game;
