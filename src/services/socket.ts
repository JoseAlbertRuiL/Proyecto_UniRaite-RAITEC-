import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api/apiClient';

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket | null> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) return null;
  
  socket = io(BASE_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  
  socket.on('connect', () => {
    console.log('🔌 Conectado al WebSocket');
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Desconectado del WebSocket');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Error de conexión:', error.message);
  });
  
  return socket;
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

export const onNewMessage = (callback: (data: any) => void): void => {
  if (socket) {
    socket.on('new_message', callback);
  }
};

export const offNewMessage = (): void => {
  if (socket) {
    socket.off('new_message');
  }
};