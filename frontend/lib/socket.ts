import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;

function getBaseUrl(): string {
  // api.ts uses NEXT_PUBLIC_API_BASE_URL or http://localhost:4000
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  return base.replace(/\/$/, '');
}

export function getSocket(): Socket {
  if (socket) return socket;
  const url = getBaseUrl();
  socket = io(url, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2000,
    timeout: 8000,
  });
  return socket;
}

export function connectSocket(): Promise<Socket> {
  if (socket?.connected) return Promise.resolve(socket);
  if (connectPromise) return connectPromise;
  const s = getSocket();
  connectPromise = new Promise<Socket>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve(s);
    };
    const onError = (err: any) => {
      cleanup();
      reject(err);
    };
    const onTimeout = () => {
      cleanup();
      reject(new Error('Socket connection timeout'));
    };
    function cleanup() {
      s.off('connect', onConnect);
      s.off('connect_error', onError);
      s.off('error', onError);
      s.off('connect_timeout', onTimeout as any);
      connectPromise = null;
    }
    if (s.connected) return resolve(s);
    s.once('connect', onConnect);
    s.once('connect_error', onError);
    s.once('error', onError);
    // @ts-ignore - not always present in typings
    s.once('connect_timeout', onTimeout);
  });
  return connectPromise;
}

export function joinConversationRoom(conversationId: string) {
  const s = getSocket();
  s.emit('chat:join', conversationId);
}

export function leaveConversationRoom(conversationId: string) {
  const s = getSocket();
  s.emit('chat:leave', conversationId);
}
