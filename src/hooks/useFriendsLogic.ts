import { useState, useMemo } from "react";
import { type User, type Friend } from "../services/types";
import { useUsers } from "../services/users/";
import { useFriends, useFriendRequests } from "../services/friends/";
import { auth } from "../firebase/firebase";

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
  const currentUserId = auth.currentUser?.uid;
  
  const {
    friends,
    friendIds: friendIdsArray,
    loading: friendsLoading,
    error: friendsError,
  } = useFriends();
  
  const {
    users,
    loading: usersLoading,
    error: usersError,
    searchUsers,
    getUserById
  } = useUsers();

  const {
    sendFriendRequest,
    getRequestStatus
  } = useFriendRequests();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const isSearching = !!searchTerm.trim();

  // Memoize the set of friend IDs for efficient lookup
  const friendIds = useMemo(() => new Set(friendIdsArray), [friendIdsArray]);

  // Create friends with detailed information (now coming from useFriends)
  // const friends = useMemo(() => {
  //   return friendIdsArray.map(friendId => {
  //     const user = getUserById(friendId);
  //     return {
  //       id: friendId,
  //       displayName: user?.displayName || "Unknown User",
  //       email: user?.email || "",
  //       photoURL: user?.photoURL,
  //       isActive: user?.isActive
  //     };
  //   });
  // }, [friendIdsArray, getUserById]);

  // Determine which users to display based on search state
  const displayItems = useMemo(() => {
    if (isSearching) {
      // When searching, show all users except current user and exclude friends
      const searchResults = searchUsers ? searchUsers(searchTerm, currentUserId) : [];
      return searchResults.filter(user => !friendIds.has(user.id));
    }
    // When not searching, show friends as User objects for consistency
    return friends.map(friend => ({
      id: friend.id,
      displayName: friend.displayName,
      email: friend.email,
      photoURL: friend.photoURL,
      isActive: friend.isActive
    }));
  }, [isSearching, searchTerm, searchUsers, currentUserId, friendIds, friends]);

  const currentLoading = isSearching ? usersLoading : friendsLoading;
  const currentError = isSearching ? usersError : friendsError;

  // Simplified function for adding a friend with better validation
  const handleAddFriend = async (userIdToAdd: string): Promise<void> => {
    if (!currentUserId) {
      alert("You must be logged in to add friends.");
      return;
    }

    if (userIdToAdd === currentUserId) {
      alert("You cannot add yourself as a friend.");
      return;
    }

    if (friendIds.has(userIdToAdd)) {
      alert("This user is already your friend.");
      return;
    }

    // Check if there's already a pending request using existing data
    const requestStatus = getRequestStatus(userIdToAdd);
    
    if (requestStatus) {
      if (requestStatus.type === "outgoing") {
        alert("You have already sent a friend request to this user.");
        return;
      } else if (requestStatus.type === "incoming") {
        alert("This user has already sent you a friend request. Check your incoming requests.");
        return;
      }
    }

    try {
      // Send the friend request
      const success = await sendFriendRequest(userIdToAdd);
      
      if (success) {
        alert("Friend request sent successfully!");
      } else {
        alert("Failed to send friend request. Please try again.");
      }
    } catch (error) {
      console.error("Error in handleAddFriend:", error);
      alert("An error occurred while sending the friend request.");
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