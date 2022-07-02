import WebSocket from "ws";
import { APP_EVENTS, IMessage } from "../../../my-web-app/src/types";
import { Game } from "../game";
import { ClientState } from "./types";

export class BrowserClient {
    public walletId?: string;

    private game?: Game;
    private state: ClientState = ClientState.Frozen;

    public constructor(private readonly ws: WebSocket.WebSocket, private readonly id: string) {
        //
    }

    public send(message: string | IMessage) {
        try {
            this.ws.send(typeof message === "string" ? message : JSON.stringify(message));
        } catch {
            //
        }
    }

    /**
     * Is client has active wallet
     */
    public isActive() {
        return this.state !== ClientState.Frozen;
    }

    public getId() {
        return this.id;
    }

    public activate(walletId: string) {
        if (this.state !== ClientState.Frozen) {
            console.error("This client cannot be activated");

            return;
        }

        this.state = ClientState.Pending;
        this.walletId = walletId;

        this.send({
            eventName: APP_EVENTS.CLIENT_APROVED,
            payload: {},
        });
    }

    public setReadyToGame(game: Game) {
        this.game = game;
        this.state === ClientState.WaitingGame;

        this.send({
            eventName: APP_EVENTS.ROUND_PREPARE,
            payload: {},
        });
    }

    public getState() {
        return this.state;
    }
}
