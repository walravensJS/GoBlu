import { useState, useMemo } from "react";
import { User, Friend } from "../types/user";
import { useUsers } from "../../services/users/";
import { useFriends } from "../../services/friends/";

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
    console.log("Attempting to add friend:", userIdToAdd);
    // Replace with your actual Firebase logic:
    // try {
    //   await addFriendFunction(loggedInUserId, userIdToAdd);
    //   alert("Friend added successfully!");
    //   // Optionally, refetch friends or update UI optimistically
    // } catch (err) {
    //   console.error("Failed to add friend:", err);
    //   alert(`Failed to add friend: ${err.message}`);
    // }
    alert(
      `Placeholder: Implement logic to add friend with ID ${userIdToAdd}.`
    );
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