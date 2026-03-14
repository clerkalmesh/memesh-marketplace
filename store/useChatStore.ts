import { create } from 'zustand';
import { Alert } from 'react-native';
import axiosInstance from '../lib/axios';
import useAuthStore from './useAuthStore';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  displayName: string;
  anonymousId: string;
  profilePic: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  createdAt: string;
}

interface GlobalMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderAnonymousId: string;
  senderProfilePic: string;
  text?: string;
  image?: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface Friend {
  _id: string;
  displayName: string;
  anonymousId: string;
  profilePic: string;
  isOnline?: boolean;
  lastSeen?: string;
  unreadCount: number;
}

interface FriendRequest {
  _id: string;
  userId: User;
  status: string;
  createdAt: string;
}

interface ChatState {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  globalMessages: GlobalMessage[];
  isGlobalLoading: boolean;
  friends: Friend[];
  friendRequests: FriendRequest[];
  unreadCounts: Record<string, number>;

  // Users
  getUsers: () => Promise<void>;
  
  // Private chat
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: { text?: string; image?: string }) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (user: User | null) => void;
  
  // Friends
  getFriends: () => Promise<void>;
  getFriendRequests: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  
  // Global chat
  getGlobalMessages: () => Promise<void>;
  sendGlobalMessage: (messageData: { text?: string; image?: string }) => Promise<void>;
  subscribeToGlobal: () => void;
  unsubscribeFromGlobal: () => void;
  
  // Typing
  sendTyping: (receiverId: string) => void;
  sendStopTyping: (receiverId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  globalMessages: [],
  isGlobalLoading: false,
  friends: [],
  friendRequests: [],
  unreadCounts: {},

  // Users
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/messages/users');
      set({ users: res.data });
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Private chat
  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error: any) {
      if (error.response?.status === 403) {
        Alert.alert('Error', 'You can only message friends');
      } else {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handleNewMessage = (newMessage: Message) => {
      const { selectedUser, messages } = get();
      
      if (selectedUser && 
          (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)) {
        set({ messages: [...messages, newMessage] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Update unread count
      if (newMessage.senderId !== selectedUser?._id) {
        const currentCount = get().unreadCounts[newMessage.senderId] || 0;
        set({
          unreadCounts: {
            ...get().unreadCounts,
            [newMessage.senderId]: currentCount + 1,
          },
        });
      }
    };

    socket.on('newMessage', handleNewMessage);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off('newMessage');
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },

  // Friends
  getFriends: async () => {
    try {
      const res = await axiosInstance.get('/friends/list');
      set({ friends: res.data });
      
      // Update unread counts
      const unreadMap: Record<string, number> = {};
      res.data.forEach((friend: Friend) => {
        if (friend.unreadCount > 0) {
          unreadMap[friend._id] = friend.unreadCount;
        }
      });
      set({ unreadCounts: unreadMap });
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await axiosInstance.get('/friends/requests');
      set({ friendRequests: res.data });
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  },

  sendFriendRequest: async (userId: string) => {
    try {
      await axiosInstance.post('/friends/request', { userId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Friend request sent');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send request');
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    try {
      await axiosInstance.put(`/friends/accept/${requestId}`);
      await get().getFriends();
      await get().getFriendRequests();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to accept request');
    }
  },

  rejectFriendRequest: async (requestId: string) => {
    try {
      await axiosInstance.delete(`/friends/reject/${requestId}`);
      await get().getFriendRequests();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
  },

  removeFriend: async (friendId: string) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);
      await get().getFriends();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove friend');
    }
  },

  // Global chat
  getGlobalMessages: async () => {
    set({ isGlobalLoading: true });
    try {
      const res = await axiosInstance.get('/global/get');
      set({ globalMessages: res.data });
    } catch (error) {
      Alert.alert('Error', 'Failed to load global messages');
    } finally {
      set({ isGlobalLoading: false });
    }
  },

  sendGlobalMessage: async (messageData) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await axiosInstance.post('/global/send', messageData);
      set((state) => ({ globalMessages: [...state.globalMessages, res.data] }));
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.error || 'Only admins can send global messages');
      throw error;
    }
  },

  subscribeToGlobal: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.on('newGlobalMessage', (newMessage: GlobalMessage) => {
      set((state) => ({ globalMessages: [...state.globalMessages, newMessage] }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  },

  unsubscribeFromGlobal: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off('newGlobalMessage');
    }
  },

  // Typing
  sendTyping: (receiverId: string) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit('typing', { receiverId });
    }
  },

  sendStopTyping: (receiverId: string) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit('stopTyping', { receiverId });
    }
  },
}));