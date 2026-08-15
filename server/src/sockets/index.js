import { verifyToken, AUTH_COOKIE_NAME } from "../utils/jwt.js";

function extractCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function registerSockets(io) {
  io.use((socket, next) => {
    const token = extractCookie(socket.handshake.headers.cookie, AUTH_COOKIE_NAME);
    if (!token) return next(new Error("unauthorized"));
    try {
      const payload = verifyToken(token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on("disconnect", () => {
      // no server-side state to clean up for the MVP; room membership is
      // automatically dropped by socket.io on disconnect
    });
  });
}
