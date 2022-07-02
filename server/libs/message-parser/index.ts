import { IMessage } from "../../../my-web-app/src/types";

export class MessageParser {
    constructor(private readonly message: string) {
        // todo added validation
    }

    public parse() {
        const parsedMessage = JSON.parse(this.message);

        return parsedMessage as IMessage;
    }
}
