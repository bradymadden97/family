import { db } from "./db.server";
import { createCookieSessionStorage, redirect } from "remix";

export const PLAYER_COOKIE_NAME = "playerId";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

export const storage = createCookieSessionStorage({
  cookie: {
    name: "family_session",
    // normally you want this to be `secure: true`
    // but that doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function createOrLoadPlayerId(request: Request) {
  let playerId = await getPlayerId(request);
  if (playerId == null) {
    const player = await db.player.create({ data: {} });
    playerId = player.id;
  }
  return playerId;
}

export function getPlayerSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getPlayerId(request: Request) {
  const session = await getPlayerSession(request);
  const playerId = session.get(PLAYER_COOKIE_NAME);
  if (!playerId || typeof playerId !== "string") return null;

  const loadPlayer = await db.player.findUnique({
    where: {
      id: playerId,
    },
  });
  return loadPlayer != null ? loadPlayer.id : null;
}

export async function requirePlayerId(request: Request) {
  const playerId = await getPlayerId(request);
  if (playerId === null) {
    throw redirect("/");
  }
  return playerId;
}
