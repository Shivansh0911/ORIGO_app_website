import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Storage } from '../utils/storage';

const BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001';

let globalSocket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = Storage.getAccessToken();
    if (!token) return;

    if (!globalSocket) {
      globalSocket = io(BASE_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
    }

    socketRef.current = globalSocket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    globalSocket.on('connect', onConnect);
    globalSocket.on('disconnect', onDisconnect);
    setIsConnected(globalSocket.connected);

    return () => {
      globalSocket?.off('connect', onConnect);
      globalSocket?.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = (event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, isConnected, emit };
}
