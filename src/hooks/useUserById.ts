// hooks/useUserById.ts
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { type User } from "../services/types";

export function useUserById(uid: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const ref = doc(db, "users", uid);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setUser({ ...(snapshot.data() as User), id: snapshot.id });
      }
      setLoading(false);
    };

    fetchUser();
  }, [uid]);

  return { user, loading };
}
