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
  serverTimestamp
} from "firebase/firestore";
import { db, auth, COLLECTIONS } from "./../firebase/firebase";
import { type FriendRequest, type RequestStatus } from "../services/types";
import { useFriends } from "../services/friends/useFriends";

/**
 * Simplified hook to manage friend requests
 */
export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const currentUserId = auth.currentUser?.uid;
  const { addFriend } = useFriends();
  
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    setError(null);
    
    let unsubscribeIncoming: (() => void) | null = null;
    let unsubscribeOutgoing: (() => void) | null = null;

    try {
      // Query for incoming requests (where current user is the recipient)
      const incomingRequestsQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where("to", "==", currentUserId),
        where("status", "==", 0) // Only pending requests
      );
      
      // Query for outgoing requests (where current user is the sender)
      const outgoingRequestsQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where("from", "==", currentUserId),
        where("status", "==", 0) // Only pending requests
      );
      
      // Set up listeners
      unsubscribeIncoming = onSnapshot(
        incomingRequestsQuery, 
        (snapshot) => {
          const requests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<FriendRequest, "id">),
          }));
          setIncomingRequests(requests);
          setLoading(false);
        }, 
        (error) => {
          console.error("Error in incoming requests listener:", error);
          setError(error);
          setLoading(false);
        }
      );
      
      unsubscribeOutgoing = onSnapshot(
        outgoingRequestsQuery, 
        (snapshot) => {
          const requests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<FriendRequest, "id">),
          }));
          setOutgoingRequests(requests);
          setLoading(false);
        }, 
        (error) => {
          console.error("Error in outgoing requests listener:", error);
          setError(error);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error setting up friend requests listeners:", err);
      setError(err instanceof Error ? err : new Error('Failed to set up friend requests'));
      setLoading(false);
    }
    
    return () => {
      if (unsubscribeIncoming) unsubscribeIncoming();
      if (unsubscribeOutgoing) unsubscribeOutgoing();
    };
  }, [currentUserId]);

  /**
   * Send a friend request to another user
   * Simplified - let Firestore handle duplicate prevention through UI logic
   */
  const sendFriendRequest = async (toUserId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    try {
      const requestsCollection = collection(db, COLLECTIONS.FRIEND_REQUESTS);
      await addDoc(requestsCollection, {
        from: currentUserId,
        to: toUserId,
        sentAt: serverTimestamp(),
        status: 0 // 0 for pending
      });
      return true;
    } catch (err) {
      console.error("Error sending friend request:", err);
      return false;
    }
  };

  /**
   * Cancel an outgoing friend request
   */
  const cancelRequest = async (requestId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId));
      return true;
    } catch (err) {
      console.error("Error canceling request:", err);
      return false;
    }
  };

  /**
   * Accept or reject a friend request
   */
  const respondToRequest = async (requestId: string, newStatus: 1 | 2): Promise<boolean> => {
    try {
      const request = incomingRequests.find(r => r.id === requestId);
      if (!request || !currentUserId) {
        console.error("Request not found or user not logged in");
        return false;
      }

      // If accepting, add to friends list first
      if (newStatus === 1) { // 1 for accepted
        console.log(`Accepting friend request from ${request.from} to ${currentUserId}`);
        const success = await addFriend(request.from);
        if (!success) {
          console.error("Failed to add friend");
          return false;
        }
        console.log("Successfully added friend");
      }
      
      // Delete the request (whether accepted or rejected)
      console.log(`Deleting friend request ${requestId}`);
      await deleteDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId));
      console.log("Successfully deleted friend request");
      return true;
    } catch (err) {
      console.error("Error responding to request:", err);
      return false;
    }
  };

  /**
   * Check the request status between current user and another user
   * This uses the already-loaded data instead of making new queries
   */
  const getRequestStatus = (userId: string): RequestStatus => {
    const incoming = incomingRequests.find(
      req => req.from === userId && req.status === 0
    );
    if (incoming) return { type: "incoming", request: incoming };
    
    const outgoing = outgoingRequests.find(
      req => req.to === userId && req.status === 0
    );
    if (outgoing) return { type: "outgoing", request: outgoing };
    
    return null;
  };

  /**
   * Get all pending incoming requests
   */
  const getPendingIncomingRequests = (): FriendRequest[] => {
    return incomingRequests.filter(req => req.status === 0);
  };

  return {
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    sendFriendRequest,
    cancelRequest,
    respondToRequest,
    getRequestStatus,
    getPendingIncomingRequests
  };
}