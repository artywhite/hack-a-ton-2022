import React from "react";
import { IChallengePayload } from "../ViewStates/game";

interface IProps {
    challenge: IChallengePayload;
}

export const ChallengeRow = React.memo(({ challenge }: IProps) => {
    return (
        <p>
            <h4>{challenge.exampleString}</h4>

            {challenge.asnwers.map((answer) => (
                <button>{answer}</button>
            ))}
        </p>
    );
});
