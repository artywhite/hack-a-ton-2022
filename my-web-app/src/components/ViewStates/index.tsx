import { useState } from "react";

import TopUpPlayingWallet from "./topUpPlayingWallet";
import WaitingForPlayer from "./waitingForPlayer";

enum ViewStates {
    TOP_UP_PLAYING_WALLET,
    WAITING_FOR_PLAYER,
}

function ViewStateManager() {
    const [viewState, setViewState] = useState(ViewStates.TOP_UP_PLAYING_WALLET);

    switch (viewState) {
        case ViewStates.TOP_UP_PLAYING_WALLET: {
            return <TopUpPlayingWallet />;
        }

        case ViewStates.WAITING_FOR_PLAYER: {
            return <WaitingForPlayer />;
        }
    }

    return null;
}

export default ViewStateManager;
