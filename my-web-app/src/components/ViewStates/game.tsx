import { useEffect, useState } from "react";

import { APP_EVENTS } from "../../types";
import MyWebSocket from "../../utils/ws";
import { ChallengeRow } from "../Challenge";

export interface IChallengePayload {
    exampleString: string;
    asnwers: number[];
    isDone?: false;
}

function Game() {
    const [challenges, setChallenges] = useState<IChallengePayload[]>([]);

    useEffect(() => {
        const onChallengeStart = (payload: IChallengePayload) => {
            console.log("CHALLENGE_START", payload);

            setChallenges((current) => [...current, payload]);
        };

        MyWebSocket.subscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);

        return () => {
            MyWebSocket.unsubscribe(APP_EVENTS.CHALLENGE_START, onChallengeStart);
        };
    }, []);

    return (
        <div>
            <h1>game started!</h1>

            {challenges.map((challenge, i) => (
                <ChallengeRow challenge={challenge} key={i} />
            ))}
        </div>
    );
}

export default Game;
