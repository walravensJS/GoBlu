import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase/firebase';

interface User {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  avatarUrl?: string;
  createdAt?: any;
}

export function useUserById(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
        
        if (userDoc.exists()) {
          const userData = {
            id: userDoc.id,
            ...userDoc.data()
          } as User;
          setUser(userData);
        } else {
          setUser(null);
          setError(new Error('User not found'));
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
}