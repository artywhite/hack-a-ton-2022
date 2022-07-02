import { APP_EVENTS } from "../../../my-web-app/src/types";
import { Challenge } from "../challenge";
import { BrowserClient } from "../client";
import { ClientState } from "../client/types";
import { GameState } from "./types";

interface IGameStatePoint {
    playerOnePoint: number;
    playerTwoPoint: number;
}

export class Game {
    private status: GameState = GameState.WaitingStart;

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

    public start() {
        this.playerOne.send({
            eventName: APP_EVENTS.ROUND_START,
            payload: {},
        });

        this.playerTwo.send({
            eventName: APP_EVENTS.ROUND_START,
            payload: {},
        });

        this.status = GameState.Active;

        this.startChallenge(this.playerOne);
        this.startChallenge(this.playerTwo);
    }

    public startChallenge(player: BrowserClient) {
        player.setChallenge(new Challenge());
    }
}
