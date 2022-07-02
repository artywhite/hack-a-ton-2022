import { APP_EVENTS, IMessage } from "../../../my-web-app/src/types";
import { App } from "../app";
import { BrowserClient } from "../client";

const app = App.getInstance();

type IEventFasade = {
    [key in APP_EVENTS]?: (client: BrowserClient, message: IMessage) => void;
};

const EventFasade: IEventFasade = {
    [APP_EVENTS.WAITING_FOR_PLAYER]: waitingForPlayer,
    [APP_EVENTS.PLAYER_READY]: playerReady,
    [APP_EVENTS.PLAYER_INPUT]: playerAnswer,
};

export function processEvent(client: BrowserClient, message: IMessage) {
    const { eventName } = message;

    if (eventName in EventFasade && EventFasade[eventName]) {
        return EventFasade[eventName]?.(client, message);
    }

    return transferedMessageToPartner(client, message);
}

function playerReady(client: BrowserClient) {
    app.setPlayerReady(client);
}

function playerAnswer(client: BrowserClient, message: IMessage) {
    const answer = message.payload?.value as number;

    app.setPlayerAnswer(client, answer);
}

function waitingForPlayer(client: BrowserClient, message: IMessage) {
    const walletId = message.payload?.walletAddress as string;

    if (walletId) {
        app.activate(client);
    }
}

function transferedMessageToPartner(client: BrowserClient, message: IMessage) {
    app.clientMessageProccess(client, message);
}
