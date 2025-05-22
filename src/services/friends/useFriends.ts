import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, COLLECTIONS } from "../../firebase/firebase";

export function useFriends() {
  const [friends, setFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const currentUserId = auth.currentUser?.uid;
  
  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const friendDocRef = doc(db, COLLECTIONS.FRIENDS, currentUserId);
        const friendDocSnap = await getDoc(friendDocRef);
        
        if (friendDocSnap.exists()) {
          const data = friendDocSnap.data();
          setFriends(data.friendIds || []);
        } else {
          // Initialize empty friends document if it doesn't exist
          await setDoc(friendDocRef, { friendIds: [] });
          setFriends([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [currentUserId]);

  /**
   * Add a user to the current user's friends list
   */
  const addFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    try {
      // Add to current user's friends
      const currentUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, currentUserId);
      const currentUserDoc = await getDoc(currentUserFriendsRef);
      const currentFriends = currentUserDoc.exists() ? 
        currentUserDoc.data().friendIds || [] : [];
      
      if (!currentFriends.includes(friendId)) {
        await setDoc(currentUserFriendsRef, { 
          friendIds: [...currentFriends, friendId] 
        });
      }
      
      // Add current user to the other user's friends
      const otherUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, friendId);
      const otherUserDoc = await getDoc(otherUserFriendsRef);
      const otherFriends = otherUserDoc.exists() ? 
        otherUserDoc.data().friendIds || [] : [];
      
      if (!otherFriends.includes(currentUserId)) {
        await setDoc(otherUserFriendsRef, { 
          friendIds: [...otherFriends, currentUserId] 
        });
      }
      
      // Update local state
      setFriends(prev => [...prev, friendId]);
      return true;
    } catch (err) {
      console.error("Error adding friend:", err);
      return false;
    }
  };

  /**
   * Remove a user from the current user's friends list
   */
  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    try {
      // Remove from current user's friends list
      const currentUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, currentUserId);
      const updatedFriends = friends.filter(id => id !== friendId);
      await setDoc(currentUserFriendsRef, { friendIds: updatedFriends });
      
      // Remove current user from other user's friends list
      const otherUserFriendsRef = doc(db, COLLECTIONS.FRIENDS, friendId);
      const otherUserDoc = await getDoc(otherUserFriendsRef);
      if (otherUserDoc.exists()) {
        const otherFriends = otherUserDoc.data().friendIds || [];
        const updatedOtherFriends = otherFriends.filter(id => id !== currentUserId);
        await setDoc(otherUserFriendsRef, { friendIds: updatedOtherFriends });
      }
      
      // Update local state
      setFriends(updatedFriends);
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
    return friends.includes(userId);
  };

  return {
    friends,
    loading,
    error,
    addFriend,
    removeFriend,
    isFriend
  };
}