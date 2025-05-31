import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../../../firebase/firebase';
import { Users, Plus, X, UserCheck, Search } from 'lucide-react';
// Import your real hooks instead of mock ones
import { useFriends } from '../../../services/friends';
import { useUsers } from '../../../services/users';

// Simple interfaces to avoid dependency issues
interface Trip {
  id: string;
  title: string;
  description: string;
  location: string;
  from: { seconds: number };
  until: { seconds: number };
  imageUrl: string;
  userId?: string;
  sharedWith?: string[];
}

interface TripFriendsManagerProps {
  trip: Trip;
  onTripUpdate: (updatedTrip: Trip) => void;
}

// Simple friend item component
function SimpleFriendItem({ 
  userId, 
  isAdded, 
  onAdd, 
  onRemove 
}: {
  userId: string;
  isAdded: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
}) {
  const { getUserDetails } = useUsers();
  const user = getUserDetails(userId);

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition">
      <div className="flex items-center space-x-3">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-medium">
              {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        
        <div>
          <h4 className="font-medium text-gray-900">{user.displayName || 'Unknown User'}</h4>
          {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isAdded ? (
          <>
            <span className="text-sm text-green-600 flex items-center">
              <UserCheck className="w-4 h-4 mr-1" />
              Added
            </span>
            <button
              onClick={onRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Remove from trip"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onAdd}
            className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

export function TripFriendsManager({ trip, onTripUpdate }: TripFriendsManagerProps) {
  // Use your real hooks instead of mock ones
  const { friends, loading: friendsLoading, error: friendsError } = useFriends();
  const { loading: usersLoading } = useUsers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  console.log('TripFriendsManager render:', {
    currentUserId,
    friends,
    friendsLoading,
    friendsError,
    trip: trip?.id
  });

  // Early return for errors
  if (friendsError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 mb-2">Error loading friends</p>
          <p className="text-sm text-gray-500">{friendsError.message}</p>
        </div>
      </div>
    );
  }

  // Get friend IDs from the friends array (these are User objects, so we need their IDs)
  const friendIds = friends ? friends.map(friend => friend.id) : [];

  // Get friends already added to trip
  const tripFriendIds = friendIds.filter(friendId => 
    trip.sharedWith?.includes(friendId)
  );

  // Get friends not yet added to trip
  const availableFriendIds = friendIds.filter(friendId => 
    !trip.sharedWith?.includes(friendId)
  );

  const addFriendToTrip = async (friendId: string) => {
    if (!trip.id || !currentUserId) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.TRIPS, trip.id), {
        sharedWith: arrayUnion(friendId)
      });

      const updatedTrip = {
        ...trip,
        sharedWith: [...(trip.sharedWith || []), friendId]
      };
      
      onTripUpdate(updatedTrip);
      
      alert('Friend has been added to your trip!');
    } catch (error) {
      console.error('Error adding friend to trip:', error);
      alert('Failed to add friend to trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFriendFromTrip = async (friendId: string) => {
    if (!trip.id || !currentUserId) return;

    if (!window.confirm('Are you sure you want to remove this friend from the trip?')) {
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.TRIPS, trip.id), {
        sharedWith: arrayRemove(friendId)
      });

      const updatedTrip = {
        ...trip,
        sharedWith: (trip.sharedWith || []).filter(id => id !== friendId)
      };
      
      onTripUpdate(updatedTrip);
      
      alert('Friend has been removed from your trip.');
    } catch (error) {
      console.error('Error removing friend from trip:', error);
      alert('Failed to remove friend from trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (friendsLoading || usersLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center">
          <Users className="w-6 h-6 mr-2 text-purple-600" />
          Trip Members ({(trip.sharedWith?.length || 0) + 1})
        </h3>
        
        <button
          onClick={() => setShowAddModal(true)}
          disabled={friendIds.length === 0}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Friends
        </button>
      </div>

      {/* Trip Owner */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Trip Owner</h4>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-3">
            {auth.currentUser?.photoURL ? (
              <img
                src={auth.currentUser.photoURL}
                alt="You"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-purple-600 font-medium">
                  {auth.currentUser?.displayName?.charAt(0).toUpperCase() || 'Y'}
                </span>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900">
                {auth.currentUser?.displayName || 'You'} (Owner)
              </h4>
              <p className="text-sm text-gray-500">{auth.currentUser?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Added Friends */}
      {tripFriendIds.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Added Friends ({tripFriendIds.length})
          </h4>
          <div className="space-y-2">
            {tripFriendIds.map(friendId => (
              <SimpleFriendItem
                key={friendId}
                userId={friendId}
                isAdded={true}
                onRemove={() => removeFriendFromTrip(friendId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Friends Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Friends to Trip</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Available Friends List */}
            <div className="flex-1 overflow-y-auto">
              {availableFriendIds.length > 0 ? (
                <div className="space-y-2">
                  {availableFriendIds.map(friendId => (
                    <SimpleFriendItem
                      key={friendId}
                      userId={friendId}
                      isAdded={false}
                      onAdd={() => {
                        addFriendToTrip(friendId);
                        setShowAddModal(false);
                        setSearchTerm('');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    All your friends have been added to this trip!
                  </p>
                </div>
              )}
            </div>

            {friendIds.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">You don't have any friends yet.</p>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    window.location.href = '/friends';
                  }}
                  className="text-purple-600 hover:text-purple-700"
                >
                  Add some friends first
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tripFriendIds.length === 0 && !showAddModal && (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 mb-3">No friends added to this trip yet.</p>
          {friendIds.length > 0 ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Add friends to share your adventure!
            </button>
          ) : (
            <div>
              <p className="text-gray-400 text-sm mb-2">You need to have friends first.</p>
              <a 
                href="/friends" 
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Go add some friends!
              </a>
            </div>
          )}
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <p><strong>Debug:</strong></p>
        <p>Current User: {currentUserId || 'None'}</p>
        <p>Total friends: {friendIds.length}</p>
        <p>Trip shared with: {trip.sharedWith?.length || 0}</p>
        <p>Available to add: {availableFriendIds.length}</p>
        <p>Loading friends: {friendsLoading ? 'Yes' : 'No'}</p>
        <p>Loading users: {usersLoading ? 'Yes' : 'No'}</p>
        <p>Error: {friendsError ? friendsError.message : 'None'}</p>
        <p>Friends data: {JSON.stringify(friends?.slice(0, 2))}</p>
      </div>
    </div>
  );
}