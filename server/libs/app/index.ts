import { APP_EVENTS, IMessage } from "../../../my-web-app/src/types";
import { BrowserClient } from "../client";
import { ClientState } from "../client/types";
import { Game } from "../game";

export class App {
    private static instance: App;

    private readonly clients: Set<BrowserClient> = new Set();
    private readonly games: Game[] = [];

    public static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }

        return App.instance;
    }

    public addClient(client: BrowserClient) {
        this.clients.add(client);
    }

    public removeClient(client: BrowserClient) {
        this.clients.delete(client);
    }

    public activate(walletId: string, client: BrowserClient) {
        const isThisWalletAlreadyActive = this.getClients().some(
            (_client) => _client !== client && _client.walletId === walletId,
        );

        if (!isThisWalletAlreadyActive) {
            client.activate(walletId);

            this.updateState();

            return true;
        }

        return false;
    }

    private newGame(playerOne: BrowserClient, playerTwo: BrowserClient) {
        const game = new Game(playerOne, playerTwo);
        this.games.push(game);

        playerOne.setReadyToRoundPrepare(game);
        playerTwo.setReadyToRoundPrepare(game);
    }

    public updateState() {
        // find pair ready to game
        const pendingClients = this.getClients().filter((client) => client.getState() === ClientState.Pending);

        if (pendingClients.length >= 2) {
            this.newGame(pendingClients[0], pendingClients[1]);

            this.debugPrint("readyFirst", pendingClients);
        }

        this.debugPrint("updateState");
    }

    public setPlayerReady(client: BrowserClient) {
        const game = client.getGame();

        if (game) {
            client.setReadyToGame();

            if (game.isReady()) {
                game.start();
            }
        }

        this.debugPrint("setPlayerReady");
    }

    public setPlayerAnswer(client: BrowserClient, asnwer: number) {
        const game = client.getGame();

        if (game) {
            game.playerAnswer(client, asnwer);
        }

        this.debugPrint("setPlayerAnswer");
    }

    // send a message from the current player to his partner
    public clientMessageProccess(client: BrowserClient, message: IMessage) {
        const game = client.getGame();

        if (game) {
            game.getPartner(client)?.send(message);
        }
    }

    private getClients() {
        return [...this.clients];
    }

    private debugPrint(label?: string, clients?: BrowserClient[]) {
        console.log(
            label,
            (clients || this.getClients()).map((client) => ({ state: client.getState(), wallet: client.walletId })),
        );

        console.log("Games", this.games);
    }
}
