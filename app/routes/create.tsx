import { ActionFunction, redirect } from "remix";
import { db } from "~/utils/db.server";
import { codeFromGameId } from "~/utils/game.server";
import {
  createOrLoadPlayerId,
  PLAYER_COOKIE_NAME,
  storage,
} from "~/utils/session.server";

export const action: ActionFunction = async ({ request, params }) => {
  const playerId = await createOrLoadPlayerId(request);
  let game = await db.game.create({
    data: {
      host: { connect: { id: playerId } },
      players: { create: [{ playerId }] },
    },
  });
  game = await db.game.update({
    where: {
      id: game.id,
    },
    data: {},
  });
  const code = codeFromGameId(game);
  const session = await storage.getSession();
  session.set(PLAYER_COOKIE_NAME, playerId);
  return redirect(`/game/${code}`, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
};
