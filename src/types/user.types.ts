export interface User {
  id: string;
  anonymousId: string;
  secretHash: string;
  displayName: string;
  profilePic?: string;
  createdAt: number;
  lastSeen?: number;
  isOnline: boolean;
}

export interface AuthResponse {
  user: User;
  secretKey: string;
}