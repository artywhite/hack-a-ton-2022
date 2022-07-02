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

function Game() {
    const [challenges, setChallenges] = useState<IChallengePayload[]>([]);

    useEffect(() => {
        const onChallengeStart = (payload: IChallengePayload) => {
            setChallenges((current) => [{ ...payload, type: ChallengeType.InProgress }, ...current]);
        };

        const onChallengeEnd = (payload: IChallengeEndResult) => {
            setChallenges((current) =>
                current.map((challenge) =>
                    challenge.id === payload.id
                        ? {
                              ...challenge,
                              type: payload.isRight ? ChallengeType.Right : ChallengeType.Wrong,
                          }
                        : challenge,
                ),
            );
        };

        MyWebSocket.subscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);
        MyWebSocket.subscribe(APP_EVENTS.CHALLENGE_END, onChallengeEnd);

        return () => {
            MyWebSocket.unsubscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);
            MyWebSocket.unsubscribe(APP_EVENTS.CHALLENGE_END, onChallengeEnd);
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
