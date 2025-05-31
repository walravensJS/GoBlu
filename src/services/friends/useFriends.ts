import { useState, useEffect } from "react";
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db, auth, COLLECTIONS } from "../../firebase/firebase";
import { type Friend } from "../types";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const currentUserId = auth.currentUser?.uid;
  
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Listen to the user's friends document
    const friendDocRef = doc(db, COLLECTIONS.FRIENDS, currentUserId);
    
    const unsubscribe = onSnapshot(friendDocRef, async (friendDocSnap) => {
      try {
        if (friendDocSnap.exists()) {
          const data = friendDocSnap.data();
          const friendIdsList = data.friendIds || [];
          setFriendIds(friendIdsList);
          
          // Fetch detailed friend information from users collection
          if (friendIdsList.length > 0) {
            const friendsWithDetails: Friend[] = [];
            
            // Get user details for each friend
            for (const friendId of friendIdsList) {
              try {
                const userDocRef = doc(db, COLLECTIONS.USERS, friendId);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  friendsWithDetails.push({
                    id: friendId,
                    displayName: userData.displayName || userData.name || "Unknown User",
                    email: userData.email || "",
                    photoURL: userData.photoURL || "",
                    isActive: userData.isActive || false,
                    addedAt: data.addedAt?.[friendId]
                  });
                } else {
                  // If user document doesn't exist, show basic info
                  friendsWithDetails.push({
                    id: friendId,
                    displayName: "Unknown User",
                    email: "",
                    photoURL: "",
                    isActive: false,
                    addedAt: data.addedAt?.[friendId]
                  });
                }
              } catch (userError) {
                console.error(`Error fetching user ${friendId}:`, userError);
                // Add basic info even if fetch fails
                friendsWithDetails.push({
                  id: friendId,
                  displayName: "Unknown User",
                  email: "",
                  photoURL: "",
                  isActive: false,
                  addedAt: data.addedAt?.[friendId]
                });
              }
            }
            
            setFriends(friendsWithDetails);
          } else {
            setFriends([]);
          }
        } else {
          // Initialize empty friends document if it doesn't exist
          await setDoc(friendDocRef, { friendIds: [] });
          setFriends([]);
          setFriendIds([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error in friends listener:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error in friends listener:", error);
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  /**
   * Add a user to the current user's friends list (bidirectional)
   */
  const addFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUserId) {
      console.error("No current user ID");
      return false;
    }
    
    try {
      console.log(`Starting bidirectional friend addition: ${currentUserId} <-> ${friendId}`);
      
      // First, add friendId to current user's friends
      const currentUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, currentUserId);
      const currentUserDoc = await getDoc(currentUserFriendsRef);
      
      let currentFriends = [];
      let currentAddedAt = {};
      
      if (currentUserDoc.exists()) {
        const data = currentUserDoc.data();
        currentFriends = data.friendIds || [];
        currentAddedAt = data.addedAt || {};
      }
      
      // Add to current user's friends if not already there
      if (!currentFriends.includes(friendId)) {
        currentFriends.push(friendId);
        currentAddedAt[friendId] = new Date();
        
        await setDoc(currentUserFriendsRef, { 
          friendIds: currentFriends,
          addedAt: currentAddedAt
        });
        console.log(`✅ Added ${friendId} to ${currentUserId}'s friends list`);
      } else {
        console.log(`${friendId} already in ${currentUserId}'s friends list`);
      }
      
      // Second, add current user to friendId's friends
      const otherUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, friendId);
      const otherUserDoc = await getDoc(otherUserFriendsRef);
      
      let otherFriends = [];
      let otherAddedAt = {};
      
      if (otherUserDoc.exists()) {
        const data = otherUserDoc.data();
        otherFriends = data.friendIds || [];
        otherAddedAt = data.addedAt || {};
      }
      
      // Add to other user's friends if not already there
      if (!otherFriends.includes(currentUserId)) {
        otherFriends.push(currentUserId);
        otherAddedAt[currentUserId] = new Date();
        
        await setDoc(otherUserFriendsRef, { 
          friendIds: otherFriends,
          addedAt: otherAddedAt
        });
        console.log(`✅ Added ${currentUserId} to ${friendId}'s friends list`);
      } else {
        console.log(`${currentUserId} already in ${friendId}'s friends list`);
      }
      
      console.log(`✅ Bidirectional friendship complete: ${currentUserId} <-> ${friendId}`);
      return true;
    } catch (err) {
      console.error("❌ Error adding friend:", err);
      return false;
    }
  };

  /**
   * Remove a user from the current user's friends list (bidirectional)
   */
  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    try {
      // Remove from current user's friends list
      const currentUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, currentUserId);
      const currentUserDoc = await getDoc(currentUserFriendsRef);
      
      if (currentUserDoc.exists()) {
        const currentData = currentUserDoc.data();
        const updatedFriends = (currentData.friendIds || []).filter((id: string) => id !== friendId);
        const updatedAddedAt = { ...currentData.addedAt };
        delete updatedAddedAt[friendId];
        
        await setDoc(currentUserFriendsRef, { 
          friendIds: updatedFriends,
          addedAt: updatedAddedAt
        });
      }
      
      // Remove current user from other user's friends list
      const otherUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, friendId);
      const otherUserDoc = await getDoc(otherUserFriendsRef);
      
      if (otherUserDoc.exists()) {
        const otherData = otherUserDoc.data();
        const updatedOtherFriends = (otherData.friendIds || []).filter((id: string) => id !== currentUserId);
        const updatedOtherAddedAt = { ...otherData.addedAt };
        delete updatedOtherAddedAt[currentUserId];
        
        await setDoc(otherUserFriendsRef, { 
          friendIds: updatedOtherFriends,
          addedAt: updatedOtherAddedAt
        });
      }
      
      return true;
    } catch (err) {
      console.error("Error removing friend:", err);
      return false;
    }
  };

  /**
   * Check if a user is in the current user's friends list
   */
  const isFriend = (userId: string): boolean => {
    return friendIds.includes(userId);
  };

  return {
    friends,
    friendIds,
    loading,
    error,
    addFriend,
    removeFriend,
    isFriend
  };
}