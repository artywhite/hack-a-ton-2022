import WebSocket from "ws";
import { APP_EVENTS, IMessage } from "../../../my-web-app/src/types";
import { Challenge } from "../challenge";
import { Game } from "../game";
import { ClientState } from "./types";

export class BrowserClient {
    public walletId?: string;

    private game?: Game;
    private state: ClientState = ClientState.Frozen;

    private activeChallenge?: Challenge;

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

    public getGame() {
        return this.game;
    }

    public setReadyToRoundPrepare(game: Game) {
        this.game = game;
        this.state = ClientState.WaitingGame;

        this.send({
            eventName: APP_EVENTS.ROUND_PREPARE,
            payload: {},
        });
    }

    public setReadyToGame() {
        this.state = ClientState.ReadyToGame;
    }

    public getState() {
        return this.state;
    }

    public setChallenge(activeChallenge: Challenge) {
        this.activeChallenge = activeChallenge;

        this.send({
            eventName: APP_EVENTS.CHALLENGE_START,
            payload: this.activeChallenge.toMessage(),
        });
    }

    public challengeEnd(answer: number) {
        if (this.activeChallenge) {
            const result = this.activeChallenge.check(answer);

            this.send({
                eventName: APP_EVENTS.CHALLENGE_END,
                payload: {
                    id: this.activeChallenge.getId(),
                    isRight: result,
                },
            });

            this.activeChallenge = undefined;

            return result;
        }
    }
}
