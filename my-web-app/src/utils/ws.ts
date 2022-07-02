export enum SubscriptionType {
    CONNECT = "CONNECT",
    DISCONNECT = "DISCONNECT",
}

interface ISubscription {
    eventName: SubscriptionType | string;
    callback: (payload: any) => void;
}

const RECONNECT_TIMEOUT = 10000;

class MyWebSocket {
    private socket?: WebSocket;

    private walletAddress?: string;

    subscriptions: ISubscription[] = [];
    private reconnectTimeout?: number;

    reconnect() {
        this.socket?.close();

        window.clearTimeout(this.reconnectTimeout);
        this.connect();
    }

    public init(walletAddress: string) {
        this.walletAddress = walletAddress;
    }

    public connect() {
        this.socket = new WebSocket(`ws://localhost:9000?walletAddress=${this.walletAddress || ""}`);

        this.socket.addEventListener("open", () => {
            console.log("ws open");

            this.trigger(SubscriptionType.CONNECT, true);
        });

        this.socket.addEventListener("error", (error) => {
            this.socket?.close();
        });

        this.socket.addEventListener("close", (error) => {
            this.trigger(SubscriptionType.DISCONNECT, true);
            window.clearTimeout(this.reconnectTimeout);

            this.reconnectTimeout = window.setTimeout(() => {
                this.connect();
            }, RECONNECT_TIMEOUT);
        });

        this.socket.addEventListener("message", (event) => {
            console.log("ws on message", { event });
            try {
                const { eventName, payload } = JSON.parse(event.data);

                this.subscriptions.forEach((s) => {
                    if (s.eventName === eventName) {
                        s.callback(payload);
                    }
                });
            } catch (error) {
                console.error(error);
            }
        });
    }

    public close() {
        this.socket?.close();
    }

    subscribe(eventName: string, callback: (payload?: any) => void) {
        const newSubscription = { eventName, callback };
        this.subscriptions.push(newSubscription);

        // unsubscribe
        return () => {
            this.subscriptions = this.subscriptions.filter((s) => s !== newSubscription);
        };
    }

    unsubscribe(eventName: string, callback: (payload?: any) => void) {
        this.subscriptions = this.subscriptions.filter((s) => s.callback !== callback);
    }

    unsubscribeAll() {
        this.subscriptions = [];
    }

    private trigger(eventName: string, payload: any) {
        for (const s of this.subscriptions) {
            if (s.eventName === eventName) {
                s.callback(payload);
            }
        }
    }

    send(eventName: string, payload: any) {
        try {
            if (this.socket?.readyState === 1) {
                this.socket?.send(JSON.stringify({ eventName, payload }));
            }
        } catch (e) {
            console.error(e);
        }
    }

    destroy() {
        this.socket?.close(1000, "Ooops :)");
    }
}

const myWebSocket = new MyWebSocket();

export default myWebSocket;
