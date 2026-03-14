import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

//const BASE_URL = 'https://backtesting-production.up.railway.app';
const BASE_URL = "memesh-network-server-production.up.railway.app";

class SocketManager {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(BASE_URL, {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketManager = new SocketManager();