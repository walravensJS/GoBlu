import React, { useState } from 'react';
import { Users, UserPlus, UserCheck, UserX, Send, Clock, Search, X } from 'lucide-react';
import { useFriendsSystem } from '../../hooks/useFriendsSystem';

export default function Friends() {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    searchUsers,
    getRequestStatus,
    clearError
  } = useFriendsSystem();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmRemove, setShowConfirmRemove] = useState<string | null>(null);

  const searchResults = searchUsers(searchTerm);

  const handleSendRequest = async (userId: string) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      setSearchTerm(''); // Clear search after sending
    }
  };

  const handleAccept = async (requestId: string, fromUserId: string) => {
    await acceptFriendRequest(requestId, fromUserId);
  };

  const handleReject = async (requestId: string) => {
    await rejectFriendRequest(requestId);
  };

  const handleCancel = async (requestId: string) => {
    await cancelFriendRequest(requestId);
  };

  const handleRemoveFriend = async (friendId: string) => {
    await removeFriend(friendId);
    setShowConfirmRemove(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
        <p className="text-gray-600">Manage your connections and friend requests</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
            activeTab === 'friends'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          My Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Requests ({incomingRequests.length + outgoingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
            activeTab === 'search'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Search className="w-4 h-4 mr-2" />
          Find People
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
                <p className="text-gray-600 mb-4">Start by searching for people to connect with</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {friend.user?.photoURL ? (
                          <img
                            src={friend.user.photoURL}
                            alt={friend.user.displayName || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {friend.user?.displayName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {friend.user?.displayName || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600">{friend.user?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowConfirmRemove(friend.friendId)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove friend"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Incoming Requests</h2>
                <div className="grid gap-4">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {request.fromUser?.photoURL ? (
                            <img
                              src={request.fromUser.photoURL}
                              alt={request.fromUser.displayName || 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {request.fromUser?.displayName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {request.fromUser?.displayName || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-600">{request.fromUser?.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAccept(request.id, request.from)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent Requests</h2>
                <div className="grid gap-4">
                  {outgoingRequests.map((request) => (
                    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {request.toUser?.photoURL ? (
                            <img
                              src={request.toUser.photoURL}
                              alt={request.toUser.displayName || 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {request.toUser?.displayName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {request.toUser?.displayName || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-600">{request.toUser?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Pending</span>
                          <button
                            onClick={() => handleCancel(request.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">All caught up with friend requests!</p>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for people by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {searchResults.length === 0 && searchTerm ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((user) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.displayName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {user.displayName || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searchTerm && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Find new friends</h3>
                <p className="text-gray-600">Start typing to search for people to connect with</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Remove Modal */}
      {showConfirmRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Friend</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to remove this friend? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleRemoveFriend(showConfirmRemove)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => setShowConfirmRemove(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}