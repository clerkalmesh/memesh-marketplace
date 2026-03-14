import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { User, AuthResponse } from '../types/user.types';

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private usersCollection = collection(db, 'users');

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ==================== HELPERS ====================

  private generateSecretKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  private generateAnonymousId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'MESH-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private hashSecretKey(secretKey: string): string {
    return CryptoJS.SHA256(secretKey).toString();
  }

  private getDefaultAvatar(seed: string): string {
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}`;
  }

  // ==================== SESSION (30 DAYS) ====================

  private async saveSession(anonymousId: string, secretKey: string): Promise<void> {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    
    await SecureStore.setItemAsync('anonymousId', anonymousId);
    await SecureStore.setItemAsync('secretKey', secretKey);
    await SecureStore.setItemAsync('sessionExpiry', expiry.toISOString());
  }

  async hasValidSession(): Promise<boolean> {
    try {
      const expiryStr = await SecureStore.getItemAsync('sessionExpiry');
      if (!expiryStr) return false;

      const expiry = new Date(expiryStr);
      const now = new Date();

      if (now > expiry) {
        await this.clearSession();
        return false;
      }

      const anonymousId = await SecureStore.getItemAsync('anonymousId');
      const secretKey = await SecureStore.getItemAsync('secretKey');

      return !!(anonymousId && secretKey);
    } catch {
      return false;
    }
  }

  async getValidSession(): Promise<{ anonymousId: string; secretKey: string } | null> {
    const isValid = await this.hasValidSession();
    if (!isValid) return null;

    const anonymousId = await SecureStore.getItemAsync('anonymousId');
    const secretKey = await SecureStore.getItemAsync('secretKey');

    if (anonymousId && secretKey) {
      return { anonymousId, secretKey };
    }
    return null;
  }

  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync('anonymousId');
    await SecureStore.deleteItemAsync('secretKey');
    await SecureStore.deleteItemAsync('sessionExpiry');
    this.currentUser = null;
  }

  // ==================== SIGNUP ====================

  async signup(): Promise<AuthResponse> {
    try {
      const secretKey = this.generateSecretKey();
      const secretHash = this.hashSecretKey(secretKey);

      let anonymousId: string;
      let exists: boolean;

      do {
        anonymousId = this.generateAnonymousId();
        const userDoc = await getDoc(doc(this.usersCollection, anonymousId));
        exists = userDoc.exists();
      } while (exists);

      const now = Date.now();
      const user: User = {
        id: anonymousId,
        anonymousId,
        secretHash,
        displayName: 'Anonymous',
        profilePic: this.getDefaultAvatar(anonymousId),
        createdAt: now,
        lastSeen: now,
        isOnline: true,
      };

      await setDoc(doc(this.usersCollection, anonymousId), user);

      return { user, secretKey };
    } catch (error) {
      throw new Error('Signup gagal: ' + error);
    }
  }

  // ==================== LOGIN ====================

  async login(anonymousId: string, secretKey: string): Promise<User> {
    try {
      const userDoc = await getDoc(doc(this.usersCollection, anonymousId));

      if (!userDoc.exists()) {
        throw new Error('Anonymous ID tidak ditemukan');
      }

      const user = userDoc.data() as User;
      const inputHash = this.hashSecretKey(secretKey);

      if (inputHash !== user.secretHash) {
        throw new Error('Secret key tidak valid');
      }

      await this.updateUserOnlineStatus(anonymousId, true);
      await this.saveSession(anonymousId, secretKey);

      this.currentUser = user;
      return user;
    } catch (error) {
      throw new Error('Login gagal: ' + error);
    }
  }

  // ==================== AUTO LOGIN (30 DAYS) ====================

  async autoLogin(): Promise<User | null> {
    try {
      const session = await this.getValidSession();
      if (!session) return null;

      const userDoc = await getDoc(doc(this.usersCollection, session.anonymousId));

      if (!userDoc.exists()) {
        await this.clearSession();
        return null;
      }

      const user = userDoc.data() as User;
      const inputHash = this.hashSecretKey(session.secretKey);

      if (inputHash !== user.secretHash) {
        await this.clearSession();
        return null;
      }

      await this.updateUserOnlineStatus(user.id, true);
      this.currentUser = user;

      return user;
    } catch (error) {
      await this.clearSession();
      return null;
    }
  }

  // ==================== LOGOUT ====================

  async logout(): Promise<void> {
    try {
      if (this.currentUser) {
        await this.updateUserOnlineStatus(this.currentUser.id, false);
      }
      await this.clearSession();
    } catch (error) {
      throw new Error('Logout gagal: ' + error);
    }
  }

  // ==================== ONLINE STATUS ====================

  private async updateUserOnlineStatus(anonymousId: string, isOnline: boolean): Promise<void> {
    try {
      await updateDoc(doc(this.usersCollection, anonymousId), {
        isOnline,
        lastSeen: Date.now(),
      });

      if (this.currentUser?.id === anonymousId) {
        this.currentUser = {
          ...this.currentUser!,
          isOnline,
          lastSeen: Date.now(),
        };
      }
    } catch (error) {
      console.log('Error update status:', error);
    }
  }

  // ==================== GETTERS ====================

  getCurrentUser(): User | null {
    return this.currentUser;
  }
}

export default AuthService.getInstance();