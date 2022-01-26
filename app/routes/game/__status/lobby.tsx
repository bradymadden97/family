import { useState } from "react";
import { Form, useTransition } from "remix";
import { GameLoaderData, PlayerData } from "../$code";

const EMOJIS = [
  "🦊",
  "🐯",
  "🐷",
  "🐨",
  "🐻",
  "🐼",
  "🐔",
  "🐧",
  "🐸",
  "🐢",
  "🐟",
  "🐡",
  "🐝",
];

export default function Lobby(props: { data: GameLoaderData }) {
  const transition = useTransition();
  const { game, players: allPlayers, me } = props.data;

  const meReady = !me.isSpectating && me.character != null;
  const readyPlayers = allPlayers.filter(
    (p) => !p.isSpectating && p.hasEnteredCharacter
  );

  const [showCharText, setShowCharText] = useState(false);

  return (
    <div>
      {(me.isSpectating || meReady) && (
        <div className="counterContainer">
          <div>
            <h1>
              {readyPlayers.map((player) => (
                <span
                  style={{ marginLeft: "4px", marginRight: "4px" }}
                  key={String(player.playerId)}
                >
                  {EMOJIS[new Date(player.joinedAt).getTime() % EMOJIS.length]}
                </span>
              ))}
            </h1>
            {readyPlayers.length}{" "}
            <h3>{readyPlayers.length === 1 ? "Player" : "Players"} Ready </h3>
            {meReady && (
              <Form method="post">
                <div style={{ margin: "auto" }}>
                  <button
                    className="button editCharacterBtn"
                    type="submit"
                    name="_action"
                    value="unset_character"
                  >
                    Edit your character
                  </button>
                </div>
              </Form>
            )}
          </div>
        </div>
      )}

      {!meReady && !me.isSpectating && (
        <Form method="post">
          <div>
            <b style={{ marginLeft: "1rem" }}>Enter your character's name:</b>
            <div className="characterForm">
              <div className="characterInputWrapper">
                <input
                  className="characterInput"
                  type={showCharText ? "text" : "password"}
                  name="character"
                  placeholder="Ex. Tony Bennett"
                  autoFocus={true}
                  autoComplete="off"
                  autoCapitalize="off"
                />
                <button
                  type="button"
                  className={`characterInputHideShow ${showCharText && "show"}`}
                  onClick={() => setShowCharText((s) => !s)}
                ></button>
              </div>
              <button
                className="button"
                type="submit"
                name="_action"
                value="set_character"
                disabled={transition.state === "submitting"}
              >
                Submit
              </button>
            </div>
          </div>
        </Form>
      )}

      {me.isHost && (
        <div className="buttonContainer everyonesIn">
          <form method="post">
            <button
              className="button"
              type="submit"
              name="_action"
              value="lock_lobby"
            >
              Everybody's In
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
