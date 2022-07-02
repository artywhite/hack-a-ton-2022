import { useCallback, useEffect, useState } from "react";

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
    asnwers: number[];
    type?: ChallengeType;
}

export interface IChallengeEndResult {
    id: string;
    isRight: boolean;
}

interface IGameState {
    playerOnePoint: number;
    playerTwoPoint: number;
    currentPlayer: 1 | 2;
}

interface IGameResult {
    myPoints: number;
    partnerPoints: number;
}

interface ITimeLeft {
    timeLeft?: number;
}

function Game() {
    const [timeLeft, setTimeLeft] = useState<number>();

    const [gameState, setGameState] = useState<IGameResult>();
    const [challenges, setChallenges] = useState<IChallengePayload[]>([]);

    useEffect(() => {
        const onChallengeStart = (payload: IChallengePayload) => {
            setChallenges((current) => [{ ...payload, type: ChallengeType.InProgress }, ...current]);
        };

        const onChallengeEnd = (payload: IChallengeEndResult) => {
            const isPlayerAnswerCorrect = payload.isRight;

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
        };

        const onGameStateUpdate = (payload: IGameState) => {
            const myPoints = payload.currentPlayer === 1 ? payload.playerOnePoint : payload.playerTwoPoint;
            const partnerPoints = payload.currentPlayer === 1 ? payload.playerTwoPoint : payload.playerOnePoint;

            setGameState({
                myPoints,
                partnerPoints,
            });
        };

        const onTimerLeft = (payload: ITimeLeft) => {
            setTimeLeft(payload.timeLeft);
        };

        MyWebSocket.subscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);
        MyWebSocket.subscribe(APP_EVENTS.CHALLENGE_END, onChallengeEnd);
        MyWebSocket.subscribe(APP_EVENTS.GAME_STATE_UPDATE, onGameStateUpdate);
        MyWebSocket.subscribe(APP_EVENTS.ROUND_TIMER, onTimerLeft);

        return () => {
            MyWebSocket.unsubscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);
            MyWebSocket.unsubscribe(APP_EVENTS.CHALLENGE_END, onChallengeEnd);
            MyWebSocket.unsubscribe(APP_EVENTS.GAME_STATE_UPDATE, onGameStateUpdate);
            MyWebSocket.unsubscribe(APP_EVENTS.ROUND_TIMER, onTimerLeft);
        };
    }, []);

    const onAnswer = useCallback((answer: Number) => {
        MyWebSocket.send(APP_EVENTS.PLAYER_INPUT, {
            value: answer,
        });
    }, []);

    return (
        <div>
            <h1>game started!</h1>

            {timeLeft && <h4>Time: {Math.floor(timeLeft / 1000)}</h4>}

            {gameState && (
                <h4>
                    GAME RESULT:
                    <p>
                        My game points: <b>{gameState.myPoints}</b>
                    </p>
                    <p>
                        Opponent's game points : <b>{gameState.partnerPoints}</b>
                    </p>
                </h4>
            )}

            <div
                style={{
                    maxHeight: "400px",
                    overflow: "auto",
                }}
            >
                {challenges.map((challenge, i) => (
                    <ChallengeRow challenge={challenge} key={i} onAnswer={onAnswer} />
                ))}
            </div>
        </div>
    );
}

export default Game;
