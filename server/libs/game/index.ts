import { APP_EVENTS, IMessage } from "../../../my-web-app/src/types";
import { Challenge } from "../challenge";
import { BrowserClient } from "../client";
import { ClientState } from "../client/types";
import { GameState } from "./types";

interface IGameStatePoint {
    playerOnePoint: number;
    playerTwoPoint: number;
}

const ROUND_LENGTH = 60 * 1000;

export class Game {
    private status: GameState = GameState.WaitingStart;

    private timer?: NodeJS.Timeout;
    private startTime = 0;

    private gameState: IGameStatePoint = {
        playerOnePoint: 0,
        playerTwoPoint: 0,
    };

    public constructor(private playerOne: BrowserClient, private playerTwo: BrowserClient) {
        //
    }

    public getPartner(player: BrowserClient) {
        if (player.walletId === this.playerOne.walletId) {
            return this.playerTwo;
        } else if (player.walletId === this.playerTwo.walletId) {
            return this.playerOne;
        }

        return null;
    }

    public isReady() {
        return (
            this.playerOne.getState() === ClientState.ReadyToGame &&
            this.playerTwo.getState() === ClientState.ReadyToGame
        );
    }

    private sendToAllPlayer(message: IMessage) {
        this.playerOne.send(message);
        this.playerTwo.send(message);
    }

    public end() {
        if (this.status !== GameState.Ended) {
            clearInterval(this.timer);

            this.status = GameState.Ended;
            this.sendToAllPlayer({
                eventName: APP_EVENTS.ROUND_END,
                payload: {},
            });
        }
    }

    private startTimerInterval() {
        this.startTime = Date.now();

        clearInterval(this.timer);
        this.timer = setInterval(() => {
            const dt = this.startTime + ROUND_LENGTH - Date.now();

            if (dt > 0) {
                this.sendToAllPlayer({
                    eventName: APP_EVENTS.ROUND_TIMER,
                    payload: {
                        timeLeft: dt,
                    },
                });
            } else {
                this.end();
            }
        }, 1000);
    }

    public start() {
        if (this.status === GameState.Active) {
            return;
        }

        this.startTimerInterval();

        this.sendToAllPlayer({
            eventName: APP_EVENTS.ROUND_START,
            payload: {},
        });

        this.status = GameState.Active;

        this.startChallenge(this.playerOne);
        this.startChallenge(this.playerTwo);
    }

    public startChallenge(player: BrowserClient) {
        const challengesCount = player.getChallenges().length;
        player.setChallenge(new Challenge(challengesCount));
    }

    public getStateByPlayer(player: BrowserClient) {
        return {
            ...this.gameState,
            currentPlayer: player === this.playerOne ? 1 : 2,
        };
    }

    public sendState() {
        this.playerOne.send({
            eventName: APP_EVENTS.GAME_STATE_UPDATE,
            payload: {
                ...this.gameState,
                currentPlayer: 1,
            },
        });

        this.playerTwo.send({
            eventName: APP_EVENTS.GAME_STATE_UPDATE,
            payload: {
                ...this.gameState,
                currentPlayer: 2,
            },
        });
    }

    public playerAnswer(player: BrowserClient, asnwer: number) {
        const result = player.challengeEnd(asnwer);

        if (result) {
            if (player === this.playerOne) {
                this.gameState = {
                    ...this.gameState,
                    playerOnePoint: this.gameState.playerOnePoint + 1,
                };
            } else {
                this.gameState = {
                    ...this.gameState,
                    playerTwoPoint: this.gameState.playerTwoPoint + 1,
                };
            }
        }

        this.sendState();
        this.startChallenge(player);
    }
}
