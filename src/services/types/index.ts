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
  sentAt: Timestamp;
  status: number; // 0: pending, 1: accepted, 2: rejected
}

export type RequestStatus = {
  type: "incoming" | "outgoing";
  request: FriendRequest;
} | null;