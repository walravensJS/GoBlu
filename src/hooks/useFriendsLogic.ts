import { useState, useMemo } from "react";
import { type User, type FriendRequest } from "../services/types";
import { useUsers } from "../services/users/";
import { useFriends } from "../services/friends/";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

interface UseFriendsLogicReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
  displayItems: User[];
  friendIds: Set<string>;
  friends: Friend[];
  currentLoading: boolean;
  currentError: Error | null;
  handleAddFriend: (userIdToAdd: string) => Promise<void>;
  handleFindPeople: () => void;
}

export function useFriendsLogic(): UseFriendsLogicReturn {
  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
  } = useFriends();
  
  const {
    loading: usersLoading,
    error: usersError,
    searchUsers,
  } = useUsers();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const isSearching = !!searchTerm.trim();

  // Memoize the set of friend IDs for efficient lookup
  const friendIds = useMemo(() => new Set(friends.map(f => f.id)), [friends]);

  // Determine which users to display based on search state
  const displayItems = useMemo(() => {
    if (isSearching) {
      return searchUsers ? searchUsers(searchTerm) : [];
    }
    return friends;
  }, [isSearching, searchTerm, searchUsers, friends]);

  const currentLoading = isSearching ? usersLoading : friendsLoading;
  const currentError = isSearching ? usersError : friendsError;

  // Placeholder function for adding a friend
  const handleAddFriend = async (userIdToAdd: string): Promise<void> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
  
      if (!currentUser) throw new Error("User not authenticated");
  
      const currentUserId = currentUser.uid;
  
      // Check if a friend request already exists
      const requestsRef = collection(db, "friendRequests");
      const existingQuery = query(
        requestsRef,
        where("from", "==", currentUserId),
        where("to", "==", userIdToAdd),
        where("status", "==", 0) // pending
      );
  
      const existing = await getDocs(existingQuery);
      if (!existing.empty) {
        alert("Friend request already sent.");
        return;
      }
  
      // Add new friend request
      const newRequest: Omit<FriendRequest, "id"> = {
        from: currentUserId,
        to: userIdToAdd,
        sentAt: serverTimestamp() as any, // Firestore Timestamp
        status: 0, // pending
      };
  
      await addDoc(requestsRef, newRequest);
      alert("Friend request sent!");
    } catch (err: any) {
      console.error("Failed to send friend request:", err);
      alert(`Error: ${err.message}`);
    }
  };
  const handleFindPeople = (): void => {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) input.focus();
  };

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    displayItems,
    friendIds,
    friends,
    currentLoading,
    currentError,
    handleAddFriend,
    handleFindPeople,
  };
}