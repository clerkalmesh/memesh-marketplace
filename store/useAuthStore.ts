import { create } from 'zustand';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '../lib/axios';
import { socketManager } from '../lib/socket';
import * as Haptics from 'expo-haptics';

interface User {
  _id: string;
  anonymousId: string;
  displayName: string;
  profilePic: string;
  isOnline?: boolean;
  lastSeen?: string;
  role?: string;
}

interface AuthState {
  authUser: User | null;
  signupData: { secretKey?: string; anonymousId?: string } | null;
  isCheckingAuth: boolean;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  onlineUsers: string[];
  socket: any | null;

  checkAuth: () => Promise<void>;
  signup: () => Promise<any>;
  login: (secretKey: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: { profilePic?: string; displayName?: string }) => Promise<User>;
  clearSignupData: () => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  signupData: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const token = await SecureStore.getItemAsync('jwt');
      if (!token) {
        set({ authUser: null, isCheckingAuth: false });
        return;
      }

      const res = await axiosInstance.get('/auth/check');
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log('Error in checkAuth:', error);
      set({ authUser: null });
      await SecureStore.deleteItemAsync('jwt');
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async () => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post('/auth/signup');
      const data = res.data;

      set({
        signupData: {
          secretKey: data.secretKey,
          anonymousId: data.anonymousId,
        },
        authUser: {
          _id: data._id,
          anonymousId: data.anonymousId,
          displayName: data.displayName,
          profilePic: data.profilePic || '',
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      get().connectSocket();
      return data;
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Signup error:', error);
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (secretKey: string) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post('/auth/login', { secretKey });
      set({ authUser: res.data });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      get().connectSocket();
      return res.data;
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Login error:', error);
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
      await SecureStore.deleteItemAsync('jwt');
      set({ authUser: null, signupData: null });
      get().disconnectSocket();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put('/auth/update-profile', data);
      set({ authUser: res.data });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return res.data;
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Update profile error:', error);
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  clearSignupData: () => set({ signupData: null }),

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    const newSocket = socketManager.connect();

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('getOnlineUsers', (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on('typing', ({ from, fromName }) => {
      // Handle typing indicator
    });

    newSocket.on('stopTyping', ({ from }) => {
      // Handle stop typing
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    socketManager.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));

export default useAuthStore;