import { Game } from "@prisma/client";
import { useEffect, useState } from "react";
import {
  ActionFunction,
  Form,
  LoaderFunction,
  MetaFunction,
  redirect,
  useFetcher,
  useLoaderData,
  useLocation,
  useParams,
  useResolvedPath,
} from "remix";
import { connect, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import useRefetch from "~/hooks/useRefetch";
import useRefetchOnVisible from "~/hooks/useRefetchOnVisible";
import useSocket from "~/hooks/useSocket";

import { gameIdFromCode } from "~/utils/game.server";
import {
  setCharacter,
  changeGameStatus,
  loadGame,
  setSpectating,
} from "./manage_game.server";
import { emitSocketUpdate } from "./manage_socket.server";
import InProgress from "./__status/inProgress";
import Lobby from "./__status/lobby";
import ReadingNames from "./__status/readingNames";
import type { LinksFunction } from "remix";
import globalStyles from "../../styles/global.css";
import localStyles from "../../styles/game.css";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: globalStyles },
    { rel: "stylesheet", href: localStyles },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap",
    },
  ];
};

export type PlayerData = {
  playerId: String;
  joinedAt: Date;
  hasEnteredCharacter: boolean;
  isSpectating: boolean;
  character?: String | null;
};
export type GameLoaderData = {
  game: Game;
  players: PlayerData[];
  me: {
    isHost: boolean;
    isSpectating: boolean;
    character: String | null;
  };
};

export const meta: MetaFunction = ({ params }) => {
  return {
    title: `Family | ${params.code ?? ""}`,
  };
};

export let loader: LoaderFunction = async ({
  request,
  params,
}): Promise<GameLoaderData> => {
  if (params.code == undefined) {
    throw redirect("/");
  }
  const gameId = gameIdFromCode(params.code);
  return await loadGame(request, gameId);
};

export const action: ActionFunction = async ({
  request,
  context,
  params,
}): Promise<GameLoaderData> => {
  if (params.code == undefined) {
    throw new Error(`Form not submitted correctly.`);
  }

  const form = await request.formData();
  let returnData;
  switch (form.get("_action")) {
    case "back_to_lobby":
      returnData = await changeGameStatus(request, params.code, "LOBBY");
      break;
    case "lock_lobby":
    case "back_to_names":
      returnData = await changeGameStatus(
        request,
        params.code,
        "READING_NAMES"
      );
      break;
    case "start_game":
      returnData = await changeGameStatus(request, params.code, "IN_PROGRESS");
      break;
    case "finish_game":
      await changeGameStatus(request, params.code, "COMPLETED");
      throw redirect("/");
    case "set_character":
      const character = form.get("character");
      if (typeof character === "string") {
        returnData = await setCharacter(request, params.code, character);
        break;
      }
    case "set_spectating":
      returnData = await setSpectating(request, params.code, true);
      break;
    case "set_playing":
      returnData = await setSpectating(request, params.code, false);
      break;
    case "unset_character":
      returnData = await setCharacter(request, params.code, null);
      break;
    default:
      throw new Error(`Form not submitted correctly.xxx`);
  }

  emitSocketUpdate(context.socket, String(returnData.game.id));
  return returnData;
};

function GameRouteImpl({ gameData }: { gameData: GameLoaderData }) {
  switch (gameData.game.status) {
    case "LOBBY":
      return <Lobby data={gameData} />;
    case "READING_NAMES":
      return <ReadingNames data={gameData} />;
    case "IN_PROGRESS":
      return <InProgress data={gameData} />;
    case "COMPLETED":
    default:
      throw new Error(`Not handled`);
  }
}

export default function GameRoute() {
  const params = useParams();
  const socket = useSocket();
  const [gameData, refetchGameData] = useRefetch<GameLoaderData>();
  useEffect(() => {
    document.addEventListener("visibilitychange", refetchGameData);
    return () =>
      document.removeEventListener("visibilitychange", refetchGameData);
  }, []);

  useEffect(() => {
    if (socket !== undefined) {
      socket.emit("join-room", String(gameData.game.id));
      socket.on("room-update", () => {
        refetchGameData();
      });
      socket.on("join-room", () => {
        refetchGameData();
      });
    }
  }, [socket]);

  let codeText;
  let topRight;

  const spectators = gameData.players.filter((p) => p.isSpectating).length;
  switch (gameData.game.status) {
    case "LOBBY":
      topRight = (
        <Form method="post" className="topRight">
          <button
            className="button playSpectateBtn"
            type="submit"
            name="_action"
            value="set_playing"
            disabled={!gameData.me.isSpectating}
          >
            Play
          </button>

          <button
            className="button playSpectateBtn"
            type="submit"
            name="_action"
            value="set_spectating"
            disabled={gameData.me.isSpectating}
          >
            Spectate
          </button>
          {spectators > 0 && (
            <h6 style={{ fontWeight: 100, marginTop: 8 }}>
              👁️ {spectators} spectators
            </h6>
          )}
        </Form>
      );
      codeText = "Join at www.family\nEnter game code:";
      break;
    case "READING_NAMES":
    case "IN_PROGRESS":
      codeText = "Game Code:";
      break;
    case "COMPLETED":
    default:
      throw new Error(`Not handled`);
  }

  return (
    <>
      <div className="topLeft">
        <a className="button playSpectateBtn" href="/">
          Home
        </a>
      </div>

      {topRight}
      <div className="heading">
        <div className="imageContainer"></div>
        <div className="codeContainer">
          <h4>{codeText}</h4>
          <h2>{params.code}</h2>
        </div>
      </div>

      <GameRouteImpl gameData={gameData} />
    </>
  );
}
