import { generateChallenge } from "../../utils/challenge-generation";
import { getId } from "../../utils/helpers";

export enum ChallengeType {
    InProgress = 1,
    Right,
    Wrong,
}

export class Challenge {
    private readonly id: string = getId();

    private readonly exampleString: string = "";
    private readonly rightAnswer: number;
    private answers: number[] = [];
    private type: ChallengeType = ChallengeType.InProgress;

    public constructor(challengesCount: number) {
        const [exampleString, rightAnswer, possibleAnswers] = generateChallenge(challengesCount);
        this.rightAnswer = rightAnswer;
        this.exampleString = exampleString;
        this.answers = possibleAnswers;
    }

    public check(value: number) {
        const isRight = value === this.rightAnswer;

        this.type = isRight ? ChallengeType.Right : ChallengeType.Wrong;

        return isRight;
    }

    public getId() {
        return this.id;
    }

    public toMessage() {
        return {
            id: this.id,
            exampleString: this.exampleString,
            answers: this.answers,
            type: this.type,
        };
    }
}

const getRandomNumber = (max = 100) => Math.floor(Math.random() * (max + 1));
