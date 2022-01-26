const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const compression = require("compression");
const morgan = require("morgan");
const { createRequestHandler } = require("@remix-run/express");

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "server/build");

const SOCKET_JOIN_ROOM_KEY = "join-room";
const SOCKET_ROOM_UPDATE_KEY = "room-update";

const app = express();
const httpServer = createServer(app);
const socket_io = new Server(httpServer);

socket_io.on("connection", (socket) => {
  socket.on(SOCKET_JOIN_ROOM_KEY, (room) => {
    socket.join(room);
    socket_io.to(room).emit(SOCKET_JOIN_ROOM_KEY, room);
  });
  socket.on(SOCKET_ROOM_UPDATE_KEY, (room) => {
    socket_io.to(room).emit(SOCKET_ROOM_UPDATE_KEY, room);
  });
});

function getSocketAsContext(_req, _res) {
  return {
    socket: socket_io,
  };
}

app.use(compression());

// You may want to be more aggressive with this caching
app.use(express.static("public", { maxAge: "1h" }));

// Remix fingerprints its assets so we can cache forever
app.use(express.static("public/build", { immutable: true, maxAge: "1y" }));

if (
  process.env.NODE_ENV === "production" &&
  process.env.USE_SECURE_COOKIE === "true"
) {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https")
      res.redirect(`https://${req.header("host")}${req.url}`);
    else next();
  });
}

app.use(morgan("tiny"));
app.all(
  "*",
  MODE !== "production"
    ? createRequestHandler({ build: require("./build") })
    : (req, res, next) => {
        purgeRequireCache();
        const build = require("./build");
        return createRequestHandler({
          build,
          getLoadContext: getSocketAsContext,
          mode: MODE,
        })(req, res, next);
      }
);

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

////////////////////////////////////////////////////////////////////////////////
function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
