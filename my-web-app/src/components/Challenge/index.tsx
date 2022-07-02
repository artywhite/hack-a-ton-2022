import React from "react";
import { ChallengeType, IChallengePayload } from "../ViewStates/game";

interface IProps {
    challenge: IChallengePayload;

    onAnswer: (answer: Number) => void;
}

export const ChallengeRow = React.memo(({ challenge, onAnswer }: IProps) => {
    const isDone = challenge.type !== ChallengeType.InProgress;

    const getTypeText = () => {
        return challenge.type === ChallengeType.Right ? "Right" : "Wrong";
    };

    return (
        <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
            <h4>{challenge.exampleString}</h4>

            {!isDone &&
                challenge.asnwers.map((answer, i) => (
                    <button key={i} onClick={() => onAnswer(answer)}>
                        {answer}
                    </button>
                ))}

            {isDone && getTypeText()}
        </div>
    );
});
