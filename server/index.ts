import WebSocket from "ws";
import { App } from "./libs/app";
import { BrowserClient } from "./libs/client";
import { processEvent } from "./libs/event-fasade";
import { MessageParser } from "./libs/message-parser";
import { getId } from "./utils/helpers";

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

                console.log("message recived", client.getId(), message);

                processEvent(client, message);
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
