import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUsers } from "../../services/users";
import { useFriends, useFriendRequests } from "../../services/friends";
import { auth } from "../../firebase/firebase";
import { type User } from "../../services/types/index";

export default function UserDetail() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { getUserById, loading: loadingUser, error: userError } = useUsers();
  const { isFriend, addFriend, removeFriend, loading: loadingFriends } = useFriends();
  const { 
    sendFriendRequest, 
    respondToRequest, 
    getRequestStatus,
    loading: loadingRequests 
  } = useFriendRequests();
  
  const currentUserId: string | undefined = auth.currentUser?.uid;
  
  const [user, setUser] = useState<User | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    if (userId) {
      const userData = getUserById(userId);
      setUser(userData || null);
    }
  }, [userId, getUserById]);

  // Clear action message after a few seconds
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Handle sending a friend request
  const handleSendFriendRequest = async () => {
    if (!currentUserId || !userId) return;
    
    setIsSubmitting(true);
    try {
      const success = await sendFriendRequest(userId);
      
      if (success) {
        setActionMessage("Friend request sent successfully!");
      } else {
        setActionMessage("Failed to send friend request. A request may already exist.");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      setActionMessage("Failed to send friend request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle accepting a friend request
  const handleAcceptFriendRequest = async () => {
    if (!userId) return;
    
    const requestStatus = getRequestStatus(userId);
    if (!requestStatus || requestStatus.type !== "incoming") return;
    
    setIsSubmitting(true);
    try {
      const success = await respondToRequest(requestStatus.request.id, 1); // 1 = accepted
      
      if (success) {
        setActionMessage("Friend request accepted!");
      } else {
        setActionMessage("Failed to accept friend request. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setActionMessage("Failed to accept friend request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rejecting a friend request
  const handleRejectFriendRequest = async () => {
    if (!userId) return;
    
    const requestStatus = getRequestStatus(userId);
    if (!requestStatus || requestStatus.type !== "incoming") return;
    
    setIsSubmitting(true);
    try {
      const success = await respondToRequest(requestStatus.request.id, 2); // 2 = rejected
      
      if (success) {
        setActionMessage("Friend request rejected.");
      } else {
        setActionMessage("Failed to reject friend request. Please try again.");
      }
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
      const success = await removeFriend(userId);
      
      if (success) {
        setActionMessage("Friend removed successfully.");
      } else {
        setActionMessage("Failed to remove friend. Please try again.");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      setActionMessage("Failed to remove friend. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current relationship status
  const getRelationshipStatus = () => {
    if (!userId || !currentUserId) return null;
    
    if (userId === currentUserId) return "self";
    if (isFriend(userId)) return "friend";
    
    const requestStatus = getRequestStatus(userId);
    if (requestStatus) {
      return requestStatus.type === "incoming" ? "incoming_request" : "outgoing_request";
    }
    
    return "none";
  };

  const relationshipStatus = getRelationshipStatus();
  
  if (loadingUser || loadingFriends || loadingRequests) {
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

                {user.createdAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user.createdAt.toDate()).toLocaleDateString()}
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

            {/* Relationship status indicator */}
            <div className="mt-3 text-sm">
              {relationshipStatus === "friend" && (
                <p className="text-green-600 font-medium">✓ Friends</p>
              )}
              {relationshipStatus === "outgoing_request" && (
                <p className="text-yellow-600">Friend request sent (pending)</p>
              )}
              {relationshipStatus === "incoming_request" && (
                <p className="text-blue-600">This user sent you a friend request</p>
              )}
              {relationshipStatus === "self" && (
                <p className="text-gray-600">This is your profile</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex space-x-3">
              {relationshipStatus === "none" && (
                <button
                  onClick={handleSendFriendRequest}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Friend Request"}
                </button>
              )}

              {relationshipStatus === "incoming_request" && (
                <>
                  <button
                    onClick={handleAcceptFriendRequest}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Accepting..." : "Accept Request"}
                  </button>
                  <button
                    onClick={handleRejectFriendRequest}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Rejecting..." : "Reject Request"}
                  </button>
                </>
              )}

              {relationshipStatus === "friend" && (
                <button
                  onClick={handleRemoveFriend}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Removing..." : "Remove Friend"}
                </button>
              )}

              {relationshipStatus === "outgoing_request" && (
                <p className="px-4 py-2 text-gray-600 bg-gray-100 rounded">
                  Friend request pending
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}