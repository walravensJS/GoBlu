import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  setDoc
} from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { type User } from "../services/types";

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  fromUser?: User; // User details populated
  toUser?: User;   // User details populated
  sentAt: any;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  user?: User; // Friend's user details
  createdAt: any;
}

export function useFriendsSystem() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentUserId = auth.currentUser?.uid;

  // Fetch all users for search
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setAllUsers(usersList);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  // Listen to friends
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const friendsQuery = query(
      collection(db, "userFriends"),
      where("userId", "==", currentUserId)
    );

    const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
      const friendsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Friend));

      // Populate friend user details
      const friendsWithDetails = await Promise.all(
        friendsList.map(async (friend) => {
          const friendUser = allUsers.find(user => user.id === friend.friendId);
          return {
            ...friend,
            user: friendUser
          };
        })
      );

      setFriends(friendsWithDetails);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching friends:", err);
      setError("Failed to load friends");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, allUsers]);

  // Listen to incoming friend requests
  useEffect(() => {
    if (!currentUserId) return;

    const incomingQuery = query(
      collection(db, "friendRequests"),
      where("to", "==", currentUserId),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(incomingQuery, async (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest));

      // Populate user details
      const requestsWithDetails = await Promise.all(
        requestsList.map(async (request) => {
          const fromUser = allUsers.find(user => user.id === request.from);
          return {
            ...request,
            fromUser
          };
        })
      );

      setIncomingRequests(requestsWithDetails);
    });

    return () => unsubscribe();
  }, [currentUserId, allUsers]);

  // Listen to outgoing friend requests
  useEffect(() => {
    if (!currentUserId) return;

    const outgoingQuery = query(
      collection(db, "friendRequests"),
      where("from", "==", currentUserId),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(outgoingQuery, async (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest));

      // Populate user details
      const requestsWithDetails = await Promise.all(
        requestsList.map(async (request) => {
          const toUser = allUsers.find(user => user.id === request.to);
          return {
            ...request,
            toUser
          };
        })
      );

      setOutgoingRequests(requestsWithDetails);
    });

    return () => unsubscribe();
  }, [currentUserId, allUsers]);

  // Send friend request
  const sendFriendRequest = async (toUserId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      // Check if request already exists
      const existingQuery = query(
        collection(db, "friendRequests"),
        where("from", "==", currentUserId),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        setError("Friend request already sent");
        return false;
      }

      // Check if they're already friends
      const friendQuery = query(
        collection(db, "userFriends"),
        where("userId", "==", currentUserId),
        where("friendId", "==", toUserId)
      );
      
      const friendDocs = await getDocs(friendQuery);
      if (!friendDocs.empty) {
        setError("You're already friends");
        return false;
      }

      await addDoc(collection(db, "friendRequests"), {
        from: currentUserId,
        to: toUserId,
        sentAt: serverTimestamp(),
        status: "pending"
      });

      return true;
    } catch (err) {
      console.error("Error sending friend request:", err);
      setError("Failed to send friend request");
      return false;
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId: string, fromUserId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      // Update request status
      await updateDoc(doc(db, "friendRequests", requestId), {
        status: "accepted"
      });

      // Add friendship for both users
      await addDoc(collection(db, "userFriends"), {
        userId: currentUserId,
        friendId: fromUserId,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "userFriends"), {
        userId: fromUserId,
        friendId: currentUserId,
        createdAt: serverTimestamp()
      });

      return true;
    } catch (err) {
      console.error("Error accepting friend request:", err);
      setError("Failed to accept friend request");
      return false;
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "friendRequests", requestId), {
        status: "rejected"
      });
      return true;
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      setError("Failed to reject friend request");
      return false;
    }
  };

  // Cancel outgoing friend request
  const cancelFriendRequest = async (requestId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, "friendRequests", requestId));
      return true;
    } catch (err) {
      console.error("Error canceling friend request:", err);
      setError("Failed to cancel friend request");
      return false;
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      // Remove friendship for current user
      const friendQuery1 = query(
        collection(db, "userFriends"),
        where("userId", "==", currentUserId),
        where("friendId", "==", friendId)
      );
      
      const friendDocs1 = await getDocs(friendQuery1);
      friendDocs1.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      // Remove friendship for the other user
      const friendQuery2 = query(
        collection(db, "userFriends"),
        where("userId", "==", friendId),
        where("friendId", "==", currentUserId)
      );
      
      const friendDocs2 = await getDocs(friendQuery2);
      friendDocs2.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      return true;
    } catch (err) {
      console.error("Error removing friend:", err);
      setError("Failed to remove friend");
      return false;
    }
  };

  // Get users available to send friend requests to
  const getAvailableUsers = (): User[] => {
    if (!currentUserId) return [];

    const friendIds = friends.map(f => f.friendId);
    const outgoingRequestIds = outgoingRequests.map(r => r.to);
    const incomingRequestIds = incomingRequests.map(r => r.from);

    return allUsers.filter(user => 
      user.id !== currentUserId && 
      !friendIds.includes(user.id) &&
      !outgoingRequestIds.includes(user.id) &&
      !incomingRequestIds.includes(user.id)
    );
  };

  // Search users
  const searchUsers = (searchTerm: string): User[] => {
    if (!searchTerm.trim()) return getAvailableUsers();

    const available = getAvailableUsers();
    return available.filter(user =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Check if user has pending request status
  const getRequestStatus = (userId: string): 'none' | 'sent' | 'received' | 'friends' => {
    if (!currentUserId) return 'none';

    if (friends.some(f => f.friendId === userId)) return 'friends';
    if (outgoingRequests.some(r => r.to === userId)) return 'sent';
    if (incomingRequests.some(r => r.from === userId)) return 'received';
    return 'none';
  };

  const clearError = () => setError(null);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    allUsers,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getAvailableUsers,
    searchUsers,
    getRequestStatus,
    clearError
  };
}