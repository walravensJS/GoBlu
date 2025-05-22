import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, COLLECTIONS } from "../../firebase/firebase";
import { type User } from "../types/index";

/**
 * Hook to fetch and manage users
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCol = collection(db, COLLECTIONS.USERS);
        const usersSnapshot = await getDocs(usersCol);
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<User, "id">),
        }));
        
        setUsers(usersList);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  /**
   * Get a user by their ID
   */
  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  /**
   * Get details for a user, with fallback values if not found
   */
  const getUserDetails = (userId: string): User => {
    return users.find(user => user.id === userId) || { 
      id: userId, 
      displayName: "Unknown User", 
      email: "",
      photoURL: "" 
    };
  };

  /**
   * Search users by keyword
   */
  const searchUsers = (keyword: string, excludeUserId?: string): User[] => {
    if (!keyword.trim() && !excludeUserId) return users;
    
    return users.filter((user) => {
      // Exclude specific user if requested (e.g., current user)
      if (excludeUserId && user.id === excludeUserId) return false;
      
      // If no search term, return all users (except excluded)
      if (!keyword.trim()) return true;
      
      const searchLower = keyword.toLowerCase().trim();
      const displayNameMatch = user.displayName?.toLowerCase().includes(searchLower) || false;
      const emailMatch = user.email?.toLowerCase().includes(searchLower) || false;
      const idMatch = user.id.toLowerCase().includes(searchLower);
      
      return displayNameMatch || emailMatch || idMatch;
    });
  };

  return {
    users,
    loading,
    error,
    getUserById,
    getUserDetails,
    searchUsers
  };
}