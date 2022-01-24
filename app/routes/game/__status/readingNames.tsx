import { useState } from "react";
import nullthrows from "~/utils/nullthrows";
import { GameLoaderData } from "../$code";

export default function ReadingNames(props: { data: GameLoaderData }) {
  const { game, players, me } = props.data;

  const [index, setIndex] = useState(-1);
  const playerNames = players
    .filter((player) => !player.isSpectating)
    .map((player) => player?.character)
    .filter((name) => name != null && name != undefined && name.length > 0)
    .map((n) => nullthrows(n));

  const handlePaginate = (dir: "up" | "down") => {
    switch (dir) {
      case "up":
        setIndex((i) => i + 1);
        break;
      case "down":
        setIndex((i) => i - 1);
        break;
    }
  };

  return (
    <div>
      {me.isHost && (
        <div style={{ marginBottom: "2rem" }}>
          <div className="charNameWrapper">
            <div className="charName">
              {index < 0 && <h4>Click the arrow to read each name</h4>}
              <h4 className="charName">
                {index >= 0 && index < playerNames.length && playerNames[index]}
              </h4>
              {index >= playerNames.length && (
                <h4>Click Start Game to begin the game!</h4>
              )}
            </div>
            <button
              className="button paginateButton"
              onClick={() => handlePaginate("down")}
              disabled={index <= 0}
            >
              &#8249;
            </button>
            <button
              className="button paginateButton"
              onClick={() => handlePaginate("up")}
              disabled={index >= playerNames.length}
            >
              &#8250;
            </button>
          </div>
        </div>
      )}

      {!me.isHost && (
        <h4 style={{ textAlign: "center", marginBottom: "12rem" }}>
          Pay attention while the host reads each character name
        </h4>
      )}

      {me.isHost && (
        <div className="buttonContainer">
          <form method="post">
            <button
              className="button"
              type="submit"
              name="_action"
              value="back_to_lobby"
            >
              <span style={{ transform: "rotate(180deg)", marginBottom: -4 }}>
                &#x279C;
              </span>
              &nbsp;Back to Game Lobby
            </button>
          </form>
          <form method="post">
            <button
              className="button"
              type="submit"
              name="_action"
              value="start_game"
              disabled={index < playerNames.length - 1}
            >
              Start Game&nbsp;<span style={{ fontWeight: 500 }}>✓</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
