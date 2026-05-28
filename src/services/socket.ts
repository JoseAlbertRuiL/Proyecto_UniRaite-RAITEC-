import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api/apiClient';

let socket: Socket | null = null;

const lastDriverPositions: Record<number, { lat: number; lng: number }> = {};

export const connectSocket = async (): Promise<Socket | null> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;
  
  socket = io(BASE_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  
  socket.on('connect', () => {
    console.log('🔌 Conectado al WebSocket');
    registerPendingNewMessage();
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Desconectado del WebSocket');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Error de conexión:', error.message);
  });
  
  socket.on('driver_location_update', (data: { lat: number; lng: number; viajeId: number }) => {
    if (data.viajeId) {
      lastDriverPositions[data.viajeId] = { lat: data.lat, lng: data.lng };
      console.log(`📦 Posición cacheada viaje ${data.viajeId}: ${data.lat}, ${data.lng}`);
    }
  });

  return socket;
};

export const getLastDriverPosition = (
  viajeId: number
): { lat: number; lng: number } | null => {
  return lastDriverPositions[viajeId] ?? null;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export const joinChat = (chatId: number): void => {
  if (socket) {
    socket.emit('join_chat', chatId.toString());
  }
};

export const sendMessage = (chatId: number, message: string, receiverId: string): void => {
  if (socket) {
    socket.emit('send_message', { chatId: chatId.toString(), message, receiverId });
  }
};

let newMessageCallback: ((data: any) => void) | null = null;

const registerPendingNewMessage = (): void => {
  if (socket && newMessageCallback) {
    socket.off('new_message', newMessageCallback);
    socket.on('new_message', newMessageCallback);
  }
};

export const onNewMessage = (callback: (data: any) => void): void => {
  newMessageCallback = callback;
  if (socket) {
    socket.off('new_message', callback);
    socket.on('new_message', callback);
  }
};

export const offNewMessage = (): void => {
  if (socket && newMessageCallback) {
    socket.off('new_message', newMessageCallback);
  }
  newMessageCallback = null;
};

export { registerPendingNewMessage };