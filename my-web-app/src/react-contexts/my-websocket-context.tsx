import React, { ReactNode } from 'react';
import MyWebSocket from '../utils/ws';

const MyWebSocketContext = React.createContext({});

interface MyWebSocketProviderProps {
    children: ReactNode;
};


export function MyWebSocketProvider({ children }: MyWebSocketProviderProps) {
    return <MyWebSocketContext.Provider value={MyWebSocket}>{children}</MyWebSocketContext.Provider>
}

export function useMyWebSocket() {
    const context = React.useContext(MyWebSocketContext);

    return context;
}

export default MyWebSocketContext;