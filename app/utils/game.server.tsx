import { Game } from "@prisma/client";
import { db } from "./db.server";
import { requirePlayerId } from "./session.server";

export const CODE_CHARS = "ABCDEFGTUVWXYZ23456789";
export const CODE_FILLER = "HJKLMNPQRS";

export function gameIdFromCode(code: String) {
  let chars = code;
  let fillerChars;

  const regex = new RegExp(`([${CODE_FILLER}])+`);
  const result = regex.exec(String(chars));
  if (result != null && result.index > -1) {
    fillerChars = chars.substr(result.index);
    chars = chars.substr(0, result.index);
  }
  chars = chars.split("").reverse().join("");

  let gameId = 0;
  for (let i = 0; i < chars.length; i++) {
    gameId += CODE_CHARS.indexOf(chars[i]) * Math.pow(CODE_CHARS.length, i);
  }

  if (fillerChars !== undefined) {
    let fillerModulo = CODE_FILLER.length % gameId;
    for (let i = 0; i < fillerChars.length; i++) {
      if (fillerChars[i] !== CODE_FILLER[fillerModulo % CODE_FILLER.length]) {
        throw new Error(`Invalid code ${code}`);
      }
      fillerModulo++;
    }
  }
  return gameId;
}

export function codeFromGameId(game: Game) {
  let code = "";
  let quotient = game.id;

  while (quotient != 0) {
    code = String(CODE_CHARS[quotient % CODE_CHARS.length]) + code;
    quotient = Math.floor(quotient / CODE_CHARS.length);
  }

  let fillerModulo = CODE_FILLER.length % game.id;
  while (code.length < 4) {
    code += String(CODE_FILLER[fillerModulo % CODE_FILLER.length]);
    fillerModulo++;
  }
  return code;
}
