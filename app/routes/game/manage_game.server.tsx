import { redirect } from "remix";
import { db } from "~/utils/db.server";
import { gameIdFromCode } from "~/utils/game.server";
import nullthrows from "~/utils/nullthrows";
import { requirePlayerId } from "~/utils/session.server";
import { GameLoaderData } from "./$code";

export async function changeGameStatus(
  request: Request,
  code: String,
  status: string
) {
  const gameId = gameIdFromCode(code);
  let game = await db.game.findUnique({
    where: {
      id: gameId,
    },
    rejectOnNotFound: true,
  });
  const playerId = await requirePlayerId(request);
  if (game.hostId !== playerId) {
    throw new Error(`Form not submitted correctly.`);
  }

  game = await db.game.update({
    where: {
      id: gameId,
    },
    data: {
      status,
    },
  });
  return await loadGame(request, game.id);
}

export async function setCharacter(
  request: Request,
  code: String,
  character: String | null
) {
  const playerId = await requirePlayerId(request);
  const gameId = gameIdFromCode(code);

  const game = await db.game.findFirst({
    where: {
      id: { equals: gameId },
      status: { equals: "LOBBY" },
    },
    rejectOnNotFound: true,
  });

  await db.playerInGame.update({
    where: {
      gameId_playerId: {
        gameId: game.id,
        playerId,
      },
    },
    data: {
      character: character != null ? String(character) : null,
    },
  });
  return await loadGame(request, game.id);
}

export async function setSpectating(
  request: Request,
  code: String,
  isSpectating: boolean
) {
  const playerId = await requirePlayerId(request);
  const gameId = gameIdFromCode(code);

  const game = await db.game.findFirst({
    where: {
      id: { equals: gameId },
      status: { equals: "LOBBY" },
    },
    rejectOnNotFound: true,
  });

  await db.playerInGame.update({
    where: {
      gameId_playerId: {
        gameId: game.id,
        playerId,
      },
    },
    data: {
      isSpectating,
    },
  });
  return await loadGame(request, game.id);
}

export async function loadGame(
  request: Request,
  gameId: number
): Promise<GameLoaderData> {
  const playerId = await requirePlayerId(request);
  const gameData = {
    game: await db.game.findFirst({
      where: {
        id: { equals: gameId },
        players: { some: { playerId: { equals: playerId } } },
      },
      include: {
        players: true,
      },
      rejectOnNotFound: true,
    }),
  };

  const players = gameData.game.players;
  const me = nullthrows(players.find((player) => player.playerId === playerId));
  const isHost = gameData.game.hostId === playerId;

  console.log(gameData);

  if (gameData.game.status === "COMPLETED") {
    throw redirect("/");
  }
  return {
    game: gameData.game,
    players: players.map((player) => ({
      playerId: player.playerId,
      joinedAt: player.joinedAt,
      hasEnteredCharacter: player.character !== null,
      isSpectating: player.isSpectating,
      character:
        isHost && gameData.game.status === "READING_NAMES"
          ? player.character
          : undefined,
    })),
    me: {
      isHost,
      isSpectating: me.isSpectating,
      character: me.character,
    },
  };
}
