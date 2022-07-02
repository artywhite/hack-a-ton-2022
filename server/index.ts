import WebSocket from "ws";
import { App } from "./libs/app";
import { processEvent } from "./libs/event-fasade";
import { MessageParser } from "./libs/message-parser";

const socketPort = 9000;

const app = App.getInstance();

export function init() {
    const wsServer = new WebSocket.Server({ port: socketPort });

    wsServer.on("connection", (ws, req) => {
        try {
            const walletAddress = parseAuthPayload(req.url || "");

            console.info("[SERVER]: New Websocket connection open", walletAddress);

            const client = app.newClient(walletAddress);
            client.addConnection(ws);

            ws.on("close", () => {
                console.log("[SERVER]: Client disconnected.");

                client.removeConnection(ws);
            });

            ws.on("message", async (receiveData) => {
                const parser = new MessageParser(receiveData.toString());
                const message = parser.parse();

                console.log("message recived", client.walletId, message);

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

const parseAuthPayload = (url: string) => {
    const payloadString = url.split("walletAddress=").pop() || "";

    return payloadString as string;
};
