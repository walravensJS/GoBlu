import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUsers } from "../../services/users";
import { useFriends } from "../../services/friends"; // Use your existing hook
import { db, auth, COLLECTIONS } from "../../firebase/firebase";
import { doc, setDoc, getDoc, addDoc, collection, updateDoc, query, where, getDocs } from "firebase/firestore";
import { type User, type FriendRequest } from "../../services/types/index";

export default function UserDetail() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { getUserById, loading: loadingUser, error: userError } = useUsers();
  const { isFriend, addFriend, removeFriend, loading: loadingFriends } = useFriends();
  const currentUserId: string | undefined = auth.currentUser?.uid;
  
  const [user, setUser] = useState<User | null>(null); 
  const [friendRequestStatus, setFriendRequestStatus] = useState<FriendRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  

  // Fetch user data
  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        const userData = await getUserById(userId);
        console.log("Fetched user:", userData); // Add this line to see what is returned

        setUser(userData);
      };
      
      fetchUser();
    }
  }, [userId, getUserById]);

  // Check friend request status
  useEffect(() => {
    const checkFriendRequestStatus = async () => {
      if (!userId || !currentUserId) return;
      
      try {
        // Check for pending request in the friends collection
        const friendsRef = collection(db, "friends");
        
        // Check outgoing request (from current user to profile user)
        const outgoingQuery = query(
          friendsRef, 
          where("from", "==", currentUserId),
          where("to", "==", userId)
        );
        
        // Check incoming request (from profile user to current user)
        const incomingQuery = query(
          friendsRef, 
          where("from", "==", userId),
          where("to", "==", currentUserId)
        );
        
        const outgoingSnapshot = await getDocs(outgoingQuery);
        const incomingSnapshot = await getDocs(incomingQuery);
        
        if (!outgoingSnapshot.empty) {
          // We found an outgoing request
          const requestDoc = outgoingSnapshot.docs[0];
          setFriendRequestStatus({
            id: requestDoc.id,
            ...requestDoc.data(),
            direction: "outgoing"
          });
        } else if (!incomingSnapshot.empty) {
          // We found an incoming request
          const requestDoc = incomingSnapshot.docs[0];
          setFriendRequestStatus({
            id: requestDoc.id,
            ...requestDoc.data(),
            direction: "incoming"
          });
        } else {
          // No request found
          setFriendRequestStatus(null);
        }
      } catch (error) {
        console.error("Error checking friend request status:", error);
      }
    };

    checkFriendRequestStatus();
  }, [userId, currentUserId]);

  // Handle sending a friend request
  const handleSendFriendRequest = async () => {
    if (!currentUserId || !userId) return;
    
    setIsSubmitting(true);
    try {
      // Create a new friend request document
      await addDoc(collection(db, "friends"), {
        from: currentUserId,
        to: userId,
        sentAt: new Date().toISOString(),
        status: "pending"
      });
      
      setActionMessage("Friend request sent successfully!");
      // Update the local state to show the pending request
      setFriendRequestStatus({
        from: currentUserId,
        to: userId,
        status: "pending",
        direction: "outgoing",
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
      setActionMessage("Failed to send friend request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle accepting a friend request
  const handleAcceptFriendRequest = async () => {
    if (!friendRequestStatus || !friendRequestStatus.id) return;
    
    setIsSubmitting(true);
    try {
      // Update the request status to "accepted"
      const requestRef = doc(db, "friends", friendRequestStatus.id);
      await updateDoc(requestRef, {
        status: "accepted"
      });
      
      // Also add the user to friends list using your existing addFriend function
      await addFriend(userId);
      
      setActionMessage("Friend request accepted!");
      // Update local state
      setFriendRequestStatus({
        ...friendRequestStatus,
        status: "accepted"
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setActionMessage("Failed to accept friend request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rejecting a friend request
  const handleRejectFriendRequest = async () => {
    if (!friendRequestStatus || !friendRequestStatus.id) return;
    
    setIsSubmitting(true);
    try {
      // Update the request status to "rejected"
      const requestRef = doc(db, "friends", friendRequestStatus.id);
      await updateDoc(requestRef, {
        status: "rejected"
      });
      
      setActionMessage("Friend request rejected.");
      // Update local state
      setFriendRequestStatus({
        ...friendRequestStatus,
        status: "rejected"
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setActionMessage("Failed to reject friend request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removing a friend
  const handleRemoveFriend = async () => {
    if (!userId) return;
    
    setIsSubmitting(true);
    try {
      // Use your existing removeFriend function
      await removeFriend(userId);
      setActionMessage("Friend removed successfully.");
    } catch (error) {
      console.error("Error removing friend:", error);
      setActionMessage("Failed to remove friend. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if users are friends (either through the hook or accepted request)
  const userIsFriend = userId && (
    isFriend(userId) || 
    (friendRequestStatus?.status === "accepted")
  );
  
  if (loadingUser || loadingFriends) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto text-red-500">
          <p>Error loading user: {userError.message}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">User not found</p>
          <Link to="/friends" className="text-blue-500 hover:text-blue-700 mt-2 inline-block">
            Back to friends
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/friends" className="text-blue-500 hover:text-blue-700 mr-4">
            ← Back to Friends
          </Link>
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>

        {actionMessage && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
            {actionMessage}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* User header with photo */}
          <div className="bg-gray-100 p-6 flex items-center">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User"} 
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold">
                {user.displayName?.charAt(0) || "U"}
              </div>
            )}
            <div className="ml-6">
              <h2 className="text-xl font-bold">{user.displayName || "Anonymous User"}</h2>
              {user.email && <p className="text-gray-600">{user.email}</p>}
            </div>
          </div>

          {/* User details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{user.id}</p>
                </div>

                {user.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
                  </div>
                )}

                {user.createdAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Connection status */}
            <div className="mt-6 flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <p className="text-sm text-gray-700">
                {user.isActive ? 'Online' : 'Offline'}
              </p>
            </div>

            {/* Friend status indicator */}
            {friendRequestStatus && (
              <div className="mt-3 text-sm">
                {friendRequestStatus.direction === "outgoing" && (
                  <p className="text-gray-600">
                    {friendRequestStatus.status === "pending" && "Friend request sent (pending)"}
                    {friendRequestStatus.status === "accepted" && "Friends"}
                    {friendRequestStatus.status === "rejected" && "Friend request rejected"}
                  </p>
                )}
                {friendRequestStatus.direction === "incoming" && friendRequestStatus.status === "pending" && (
                  <p className="text-gray-600">This user sent you a friend request</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex space-x-3">
  {!userIsFriend && !friendRequestStatus && (
    <button
      onClick={handleSendFriendRequest}
      disabled={isSubmitting}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      Send Friend Request
    </button>
  )}

  {friendRequestStatus?.direction === "incoming" && friendRequestStatus.status === "pending" && (
    <>
      <button
        onClick={handleAcceptFriendRequest}
        disabled={isSubmitting}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Accept
      </button>
      <button
        onClick={handleRejectFriendRequest}
        disabled={isSubmitting}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </>
  )}

  {userIsFriend && (
    <button
      onClick={handleRemoveFriend}
      disabled={isSubmitting}
      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
    >
      Remove Friend
    </button>
  )}
</div>

          </div>
        </div>
      </div>
    </div>
  );
}