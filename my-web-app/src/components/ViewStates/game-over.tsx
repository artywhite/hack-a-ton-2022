import { IGameState } from "./game";

interface IProps {
    state?: IGameState;
}

function GameOver({ state }: IProps) {
    return (
        <div>
            <h1>Game Over!</h1>
        </div>
    );
}

export default GameOver;
