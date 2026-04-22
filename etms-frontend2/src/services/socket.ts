import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const getSocket = () => socket;

export const connectSocket = (token: string) => {
  if (socket.connected) return;
  
  socket.auth = { token };
  socket.connect();
  
  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
  });
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export const joinTripRoom = (trip_id: number) => {
  socket.emit('trip:subscribe', { trip_id });
};

export const listenForLocationUpdate = (callback: (data: any) => void) => {
  socket.on('location:update', callback);
  return () => {
    socket.off('location:update', callback);
  };
};

export const listenForTripStatus = (callback: (data: any) => void) => {
  socket.on('trip:statusChanged', callback);
  return () => {
    socket.off('trip:statusChanged', callback);
  };
};

export const subscribeToAdminTracking = () => {
  socket.emit('admin:joinTracking');
};

export const listenForSOSAlert = (callback: (data: any) => void) => {
  socket.on('emergency:alert', callback);
  return () => {
    socket.off('emergency:alert', callback);
  };
};
