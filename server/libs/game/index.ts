import { BrowserClient } from "../client";
import { GameState } from "./types";

export class Game {
    private state: GameState = GameState.WaitingStart;

    public constructor(private playerOne: BrowserClient, private playerTwo: BrowserClient) {
        //
    }
}
