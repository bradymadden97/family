import {
  ActionFunction,
  Form,
  MetaFunction,
  redirect,
  useActionData,
  useTransition,
} from "remix";
import { db } from "~/utils/db.server";
import { codeFromGameId, gameIdFromCode } from "~/utils/game.server";
import {
  createOrLoadPlayerId,
  PLAYER_COOKIE_NAME,
  storage,
} from "~/utils/session.server";
import { emitSocketUpdate } from "./game/manage_socket.server";

import type { LinksFunction } from "remix";
import globalStyles from "../styles/global.css";
import localStyles from "../styles/join.css";
import { useState } from "react";

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

export const meta: MetaFunction = () => {
  return {
    title: `Play Family`,
  };
};

export const action: ActionFunction = async ({ request, context }) => {
  const form = await request.formData();
  const joinCode = form.get("join_code");

  if (typeof joinCode !== "string") {
    throw new Error(`Form not submitted correctly.`);
  }

  const game = await db.game.findUnique({
    where: { id: gameIdFromCode(joinCode) },
    rejectOnNotFound: true,
  });

  if (game.status !== "LOBBY") {
    throw new Error(`Cannot join game.`);
  }

  const playerId = await createOrLoadPlayerId(request);
  await db.playerInGame.upsert({
    where: {
      gameId_playerId: {
        gameId: game.id,
        playerId,
      },
    },
    update: {},
    create: { playerId, gameId: game.id },
  });
  emitSocketUpdate(context.socket, String(game.id));
  const session = await storage.getSession();
  session.set(PLAYER_COOKIE_NAME, playerId);
  return redirect(`/game/${codeFromGameId(game)}`, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
};

export default function JoinRoute() {
  const actionData = useActionData();
  const transition = useTransition();
  const [code, setCode] = useState(actionData?.values?.join_code ?? "");
  return (
    <div className="contentContainer">
      <div className="imageContainer"></div>
      <div className="inputContainer">
        <h2>Enter game code to join:</h2>
        <Form method="post">
          <div className="inputItems">
            <input
              type="text"
              className="joinInput"
              name="join_code"
              autoFocus={true}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={transition.state === "submitting"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="on"
            />
            <button
              className="button joinButton"
              type="submit"
              disabled={transition.state === "submitting" || code.length < 4}
            >
              &#x279C;
            </button>
          </div>
        </Form>
      </div>{" "}
      <a className="button backHomeLink" href="/">
        🏠 Go Back
      </a>
    </div>
  );
}
