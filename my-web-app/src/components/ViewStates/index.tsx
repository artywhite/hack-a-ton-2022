import { ReactNode, useEffect, useState } from "react";
import { useWallet } from "../../react-contexts/wallet-context";
import './index.css';

import TopUpPlayingWallet from "./topUpPlayingWallet";
import WaitingForPlayer from "./waitingForPlayer";

enum ViewStates {
    TOP_UP_PLAYING_WALLET,
    WAITING_FOR_PLAYER,
}

function ViewStateManager() {
    const { balance } = useWallet();
    const [viewState, setViewState] = useState(ViewStates.TOP_UP_PLAYING_WALLET);
    let ViewStateComponent: ReactNode = <></>;

    useEffect(() => {
        if (balance && balance !== '0') {
            setViewState(ViewStates.WAITING_FOR_PLAYER);
        }
    }, [balance]);

    switch (viewState) {
        case ViewStates.TOP_UP_PLAYING_WALLET: {
            ViewStateComponent = <TopUpPlayingWallet />;
            break;
        }

        case ViewStates.WAITING_FOR_PLAYER: {
            ViewStateComponent = <WaitingForPlayer />;
            break;
        }
    }

    return (
        <div className="view-state-manager">
            {ViewStateComponent}
        </div>
    )
}

export default ViewStateManager;
