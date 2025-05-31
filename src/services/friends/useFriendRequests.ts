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
  getDocs
} from "firebase/firestore";
import { db, auth, COLLECTIONS } from "../../firebase/firebase";
import { type FriendRequest, type RequestStatus } from "../types";
import { useFriends } from "./useFriends";

/**
 * Hook to manage friend requests
 */
export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentUserId = auth.currentUser?.uid;
  const { addFriend } = useFriends();
  
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return () => {};
    }
    
    setLoading(true);
    
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
    const unsubscribeIncoming = onSnapshot(incomingRequestsQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<FriendRequest, "id">),
      }));
      setIncomingRequests(requests);
      setLoading(false);
    }, error => {
      console.error("Error in incoming requests listener:", error);
      setLoading(false);
    });
    
    const unsubscribeOutgoing = onSnapshot(outgoingRequestsQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<FriendRequest, "id">),
      }));
      setOutgoingRequests(requests);
      setLoading(false);
    }, error => {
      console.error("Error in outgoing requests listener:", error);
      setLoading(false);
    });
    
    // Return cleanup function
    return () => {
      unsubscribeIncoming();
      unsubscribeOutgoing();
    };
  }, [currentUserId]);

  /**
   * Check if a friend request already exists between users
   */
  const hasExistingRequest = async (toUserId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    try {
      // Check for existing requests in both directions
      const outgoingQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where("from", "==", currentUserId),
        where("to", "==", toUserId),
        where("status", "==", 0)
      );
      
      const incomingQuery = query(
        collection(db, COLLECTIONS.FRIEND_REQUESTS),
        where("from", "==", toUserId),
        where("to", "==", currentUserId),
        where("status", "==", 0)
      );
      
      const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
        getDocs(outgoingQuery),
        getDocs(incomingQuery)
      ]);
      
      return !outgoingSnapshot.empty || !incomingSnapshot.empty;
    } catch (error) {
      console.error("Error checking existing requests:", error);
      return false;
    }
  };

  /**
   * Send a friend request to another user
   */
  const sendFriendRequest = async (toUserId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    try {
      // Check if request already exists
      const hasRequest = await hasExistingRequest(toUserId);
      if (hasRequest) {
        console.log("Friend request already exists");
        return false;
      }
      
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
      // Update the request status
      const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
      await updateDoc(requestRef, {
        status: newStatus
      });
      
      // If accepting, add to friends list
      if (newStatus === 1) { // 1 for accepted
        const request = incomingRequests.find(r => r.id === requestId);
        if (request && currentUserId) {
          const success = await addFriend(request.from);
          if (success) {
            // Delete the request after successful friend addition
            await deleteDoc(requestRef);
          }
        }
      } else {
        // If rejecting, delete the request
        await deleteDoc(requestRef);
      }
      
      return true;
    } catch (err) {
      console.error("Error responding to request:", err);
      return false;
    }
  };

  /**
   * Check the request status between current user and another user
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
    sendFriendRequest,
    cancelRequest,
    respondToRequest,
    getRequestStatus,
    getPendingIncomingRequests,
    hasExistingRequest
  };
}