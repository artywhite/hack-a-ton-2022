import WebSocket from "ws";
import { APP_EVENTS } from "../my-web-app/src/types";
import { App } from "./libs/app";
import { BrowserClient } from "./libs/client";
import { MessageParser } from "./libs/message-parser";

const socketPort = 9000;

const app = App.getInstance();

export function init() {
    const wsServer = new WebSocket.Server({ port: socketPort });

    wsServer.on("connection", (ws, req) => {
        try {
            const id = getId();
            console.info("[SERVER]: New Websocket connection open", id);

            const client = new BrowserClient(ws, id);
            app.addClient(client);

            ws.on("close", () => {
                console.log("[SERVER]: Client disconnected.", client.getId());

                app.removeClient(client);
            });

            ws.on("message", async (receiveData) => {
                const parser = new MessageParser(receiveData.toString());
                const message = parser.parse();

                if (message.eventName === APP_EVENTS.WAITING_FOR_PLAYER) {
                    const walletId = message.payload?.walletAddress as string;

                    if (walletId) {
                        app.activate(walletId, client);
                    }
                }
            });
        } catch (e) {
            console.error(e);
        }
    });
}

(() => {
    try {
        init();
    } catch {}
})();

function getId() {
    return Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "")
        .substring(0, 10);
}
