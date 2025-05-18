import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase"; // adjust path if needed
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Friends() {
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<string[]>([]); // list of friend user IDs
  const [search, setSearch] = useState("");

  // Current user ID - replace with your auth logic
  const currentUserId = auth.currentUser?.uid || "currentUserId";

  // Fetch all users from Firestore
  async function fetchUsers() {
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);
    const usersList = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as { name: string; email: string }),
    }));
    setUsers(usersList);
  }

  // Fetch current user's friends (IDs)
  async function fetchFriends() {
    const friendDocRef = doc(db, "friends", currentUserId);
    const friendDocSnap = await getDoc(friendDocRef);
    if (friendDocSnap.exists()) {
      const data = friendDocSnap.data();
      setFriends(data.friendIds || []);
    } else {
      setFriends([]);
    }
  }

  // Add friend: update friends document
  async function addFriend(friendId: string) {
    const friendDocRef = doc(db, "friends", currentUserId);
    const newFriends = [...friends, friendId];
    await setDoc(friendDocRef, { friendIds: newFriends });
    setFriends(newFriends);
  }

  // Remove friend
  async function removeFriend(friendId: string) {
    const friendDocRef = doc(db, "friends", currentUserId);
    const newFriends = friends.filter((id) => id !== friendId);
    await setDoc(friendDocRef, { friendIds: newFriends });
    setFriends(newFriends);
  }

  // Fetch users and friends on mount
  useEffect(() => {
    fetchUsers();
    fetchFriends();
  }, []);

  // Filter users by search input
  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Friends</h1>

      <input
        type="text"
        placeholder="Search users by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-3 py-2 border rounded"
      />

      <h2 className="font-semibold mb-2">Users</h2>
      {filteredUsers.length === 0 && <p>No users found.</p>}

      <ul className="mb-6">
        {filteredUsers.map((user) => (
          <li key={user.id} className="flex justify-between items-center mb-2">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            {friends.includes(user.id) ? (
              <button
                onClick={() => removeFriend(user.id)}
                className="text-red-500 hover:underline"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={() => addFriend(user.id)}
                className="text-blue-500 hover:underline"
              >
                Add
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2 className="font-semibold mb-2">Your Friends</h2>
      {friends.length === 0 && <p>You have no friends yet.</p>}

      <ul>
        {friends.map((friendId) => {
          const friend = users.find((u) => u.id === friendId);
          if (!friend) return null;
          return (
            <li key={friend.id} className="mb-2">
              {friend.name} ({friend.email})
            </li>
          );
        })}
      </ul>
    </div>
  );
}
