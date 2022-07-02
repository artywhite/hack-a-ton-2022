export enum ClientState {
    // Client connected, but not activated
    Frozen = "Frozen",
    // Activated and ready to game
    Pending = "Pending",
    // Waiting to start game
    WaitingGame = "WaitingGame",

    InGame = "InGame",
}
