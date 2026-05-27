import { io } from "socket.io-client";
import { API_URL } from "./config";

let socket;

export function getSocket() {
  if (socket?.connected || socket) return socket;
  const token = localStorage.getItem("token");
  socket = io(API_URL, {
    auth: { token }
  });
  return socket;
}

