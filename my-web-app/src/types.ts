export enum APP_EVENTS {
    // Server -> client. If client is approved, and his wallet address is saved
    CLIENT_APROVED = "CLIENT_APROVED",

    WAITING_FOR_PLAYER = "WAITING_FOR_PLAYER",
    ROUND_PREPARE = "ROUND_PREPARE",
    DEPLOY_CHANNEL = "DEPLOY_CHANNEL",
    CHANNEL_DEPLOYED = "CHANNEL_DEPLOYED",
    CHANNEL_INIT = "CHANNEL_INIT",
    PLAYER_READY = "PLAYER_READY",
    ROUND_START = "ROUND_START",
    CHALLENGE_START = "CHALLENGE_START",
    PLAYER_INPUT = "PLAYER_INPUT",
    CHALLENGE_END = "CHALLENGE_END",
    ROUND_TIMER = "ROUND_TIMER",

    // Получение актуального состояния игрока после реконекта по сокетам (своего рода - синхронизация)
    STATE_SYNC = "STATE_SYNC",

    // Если изменилась состояние игры (очки у игрока и его партнера)
    GAME_STATE_UPDATE = "GAME_STATE_UPDATE",

    CHANNEL_STATE_UPDATE = "CHANNEL_STATE_UPDATE",
    CHANNEL_STATE_APPROVED = "CHANNEL_STATE_APPROVED",
    ROUND_END = "ROUND_END",
}

export interface IMessage {
    eventName: APP_EVENTS;
    payload: any;
}
