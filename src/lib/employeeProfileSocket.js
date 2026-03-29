import { io } from "socket.io-client";

export function getApiOrigin() {
  const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return String(raw).replace(/\/?api\/?$/i, "").replace(/\/+$/, "") || "http://localhost:5000";
}

/**
 * Subscribes to employee profile updates. Requires JWT in handshake for secure room join.
 * @returns {() => void} disconnect
 */
export function connectEmployeeProfileSocket(token, { onProfileUpdated }) {
  const base = getApiOrigin();
  const socket = io(base, {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 2000,
  });

  const joinRoom = () => {
    try {
      const userStr = localStorage.getItem("employee_user");
      const u = userStr ? JSON.parse(userStr) : null;
      if (u?.id) socket.emit("join", { userId: u.id });
    } catch {
      /* ignore */
    }
  };

  socket.on("connect", joinRoom);
  if (socket.connected) joinRoom();
  socket.on("employee:profile:updated", onProfileUpdated);

  return () => {
    socket.off("connect", joinRoom);
    socket.off("employee:profile:updated", onProfileUpdated);
    socket.disconnect();
  };
}
