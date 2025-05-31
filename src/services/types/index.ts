import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt?: Timestamp;
  isActive?: boolean;
}

export interface Friend {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isActive?: boolean;
  addedAt?: Timestamp;
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  sentAt: Timestamp;
  status: number; // 0: pending, 1: accepted, 2: rejected
}

export type RequestStatus = {
  type: "incoming" | "outgoing";
  request: FriendRequest;
} | null;

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