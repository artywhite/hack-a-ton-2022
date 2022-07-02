import WebSocket from "ws";
import { APP_EVENTS, IMessage } from "../../../my-web-app/src/types";
import { Challenge } from "../challenge";
import { Game } from "../game";
import { ClientState } from "./types";

export class BrowserClient {
    private connections: Set<WebSocket.WebSocket> = new Set();

    private game?: Game;
    private state: ClientState = ClientState.Frozen;

    private challenges: Challenge[] = [];
    private activeChallenge?: Challenge;

    public constructor(public readonly walletId?: string) {
        //
    }

    public send(message: string | IMessage) {
        for (const connection of this.connections) {
            try {
                connection.send(typeof message === "string" ? message : JSON.stringify(message));
            } catch {
                //
            }
        }
    }

    public addConnection(ws: WebSocket.WebSocket) {
        this.connections.add(ws);
    }

    public removeConnection(ws: WebSocket.WebSocket) {
        this.connections.delete(ws);
    }

    /**
     * Is client has active wallet
     */
    public isActive() {
        return this.state !== ClientState.Frozen;
    }

    public activate() {
        if ([ClientState.Frozen, ClientState.Pending].includes(this.state)) {
            this.state = ClientState.Pending;

            this.send({
                eventName: APP_EVENTS.CLIENT_APROVED,
                payload: {},
            });
        }
    }

    public sendState() {
        this.send({
            eventName: APP_EVENTS.STATE_SYNC,
            payload: {
                state: this.state,
                challenges: this.challenges.map((challenge) => ({
                    ...challenge,
                    isActive: challenge === this.activeChallenge,
                })),
                game: this.game?.getStateByPlayer(this),
            },
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
        this.state = ClientState.InGame;

        this.challenges.push(activeChallenge);
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
