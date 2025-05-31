import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { type FriendRequest, type User } from "../services/types";

interface UseFriendRequestsReturn {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  accepted: FriendRequest[];
  loading: boolean;
  error: Error | null;
}

export function useFriendRequests(): UseFriendRequestsReturn {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [accepted, setAccepted] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      setError(new Error("Not authenticated"));
      return;
    }

    const q = query(
      collection(db, "friendRequests"),
      where("status", "<=", 1)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const requests: FriendRequest[] = [];
        snapshot.forEach((doc) =>
          requests.push({ ...(doc.data() as FriendRequest), id: doc.id })
        );

        setIncoming(
          requests.filter((r) => r.to === currentUser.uid && r.status === 0)
        );
        setOutgoing(
          requests.filter((r) => r.from === currentUser.uid && r.status === 0)
        );
        setAccepted(
          requests.filter((r) =>
            (r.from === currentUser.uid || r.to === currentUser.uid) &&
            r.status === 1
          )
        );
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching friend requests:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { incoming, outgoing, accepted, loading, error };
}
