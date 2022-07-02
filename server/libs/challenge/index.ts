export class Challenge {
    private readonly exampleString: string = "";
    private readonly rightAnswer: number;
    private asnwers: number[] = [];

    public constructor() {
        const operandA = getRandomNumber();
        const operandB = getRandomNumber();

        this.rightAnswer = operandA + operandB;
        this.exampleString = `${operandA} + ${operandB}`;

        const rightIndex = getRandomNumber(3);

        for (let i = 0; i < 4; i++) {
            if (rightIndex === i) {
                this.asnwers.push(rightIndex);
            } else {
                this.asnwers.push(getRandomNumber(200));
            }
        }
    }

    public check(value: number) {
        return value === this.rightAnswer;
    }

    public toMessage() {
        return {
            exampleString: this.exampleString,
            asnwers: this.asnwers,
        };
    }
}

const getRandomNumber = (max = 100) => Math.floor(Math.random() * (max + 1));
