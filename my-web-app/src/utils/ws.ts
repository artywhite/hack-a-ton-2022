interface ISubscription {
    eventName: string;
    callback: (payload: any) => void;
}

class MyWebSocket {
    socket: WebSocket;
    isReady: Promise<boolean>;
    subscriptions: ISubscription[] = [];

    constructor() {
        this.socket = new WebSocket("ws://localhost:3000/ws");

        let isReadyResolve: (result: boolean) => void;
        let isReadyReject: (error: any) => void;

        this.isReady = new Promise((resolve, reject) => {
            isReadyResolve = resolve;
            isReadyReject = reject;
        })

        this.socket.onopen = function (event) {
            isReadyResolve(true);
        }
        this.socket.onerror = function (error) {
            isReadyReject(error);
        }
        this.socket.onclose = function (error) {
            // TODO: reconnect?
            // browser refresh?
        }
        this.socket.onmessage = (event) => {
            console.log('ws on message', { event })
            try {
                const { eventName, payload } = JSON.parse(event.data);

                this.subscriptions.forEach((s) => {
                    if (s.eventName === eventName) {
                        s.callback(payload);
                    }
                })
            } catch (error) {
                console.error(error)
            }
        };
    }

    subscribe(eventName: string, callback: () => void) {
        const newSubscription = { eventName, callback };
        this.subscriptions.push(newSubscription);

        // unsubscribe
        return () => {
            this.subscriptions = this.subscriptions.filter(s => s !== newSubscription);
        }
    }

    unsubscribe(eventName: string, callback: () => void) {
        this.subscriptions = this.subscriptions.filter(s => s.callback !== callback);
    }

    unsubscribeAll() {
        this.subscriptions = [];
    }

    send(eventName: string, payload: any) {
        console.log('send init');
        this.isReady.then(() => {
            console.log('sending ws event', { eventName, payload })
            this.socket.send(JSON.stringify({ eventName, payload }));
        })
    }

    destroy() {
        this.socket.close(1000, "Ooops :)");
    }
}

const myWebSocket = new MyWebSocket();

export default myWebSocket;