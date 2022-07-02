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
}

function Game(props: IGameProps) {
    const { challenges: initChallenges = [], game: initGameState } = props;
    const [timeLeft, setTimeLeft] = useState<number>();

    const [gameState, setGameState] = useState<IGameState | undefined>(initGameState);
    const [challenges, setChallenges] = useState<IChallengePayload[]>(initChallenges);

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
            setGameState(payload);
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

    const myPoints = gameState?.currentPlayer === 1 ? gameState.playerOnePoint : gameState?.playerTwoPoint;
    const partnerPoints = gameState?.currentPlayer === 1 ? gameState.playerTwoPoint : gameState?.playerOnePoint;

    return (
        <div>
            <h1>game started!</h1>

            {timeLeft && <h4>Time: {Math.floor(timeLeft / 1000)}</h4>}

            {gameState && (
                <h4>
                    GAME RESULT:
                    <p>
                        My game points: <b>{myPoints}</b>
                    </p>
                    <p>
                        Opponent's game points : <b>{partnerPoints}</b>
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
