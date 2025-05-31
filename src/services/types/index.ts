import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt?: Timestamp;
  isActive?: boolean;
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  fromUser?: User; // Populated user details
  toUser?: User;   // Populated user details
  sentAt: Timestamp;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  user?: User; // Friend's user details
  createdAt: Timestamp;
}

export type RequestStatus = {
  type: "incoming" | "outgoing";
  request: FriendRequest;
} | null;

// Profile types
export interface ProfileState {
  user: any | null;
  displayName: string;
  photoFile: File | null;
  previewPhoto: string | null;
  loading: boolean;
  message: string;
  error: string | null;
}

export interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
}