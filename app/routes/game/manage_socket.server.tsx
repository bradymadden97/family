import { Server } from "socket.io";

export function emitSocketUpdate(
  socket: Server,
  room: string,
  message: string | null | undefined = undefined
) {
  socket.to(room).emit("room-update", message);
}
