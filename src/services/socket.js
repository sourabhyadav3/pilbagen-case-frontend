import { io } from 'socket.io-client';

let socket = null;

export const initSocketClient = () => {
  const token = localStorage.getItem('vktori_token');
  if (!token || token.startsWith('demo_')) return null;

  if (socket && socket.connected) {
    return socket;
  }

  // Derive Socket URL from API base URL or window origin
  const socketUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : window.location.origin.includes('5173')
    ? 'http://localhost:5000'
    : window.location.origin;

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection warning:', err.message);
  });

  return socket;
};

export const getSocketClient = () => socket;

export const disconnectSocketClient = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
