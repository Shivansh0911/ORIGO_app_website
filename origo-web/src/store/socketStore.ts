import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// PSEUDO: Replace with your Railway backend URL
const SOCKET_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: (token) => {
    if (get().socket?.connected) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },
}));
