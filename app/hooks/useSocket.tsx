import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { connect } from "~/services/ws.client";

export default function useSocket() {
  const [socket, setSocket] =
    useState<Socket<DefaultEventsMap, DefaultEventsMap>>();

  useEffect(() => {
    let connection = connect();
    setSocket(connection);
    return () => {
      connection.close();
    };
  }, []);

  return socket;
}
