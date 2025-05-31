import React, { useState } from 'react';
import { useFriendRequests } from '../../../services/friends';
import { useUsers } from '../../../services/users';
import { UserAvatar } from './UserAvatar';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function FriendRequestsSection() {
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  // Safely get friend requests with error handling
  let friendRequestsHook;
  try {
    friendRequestsHook = useFriendRequests();
  } catch (error) {
    console.error('Error in useFriendRequests:', error);
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error loading friend requests. Please refresh the page.</p>
      </div>
    );
  }

  const {
    incomingRequests = [],
    outgoingRequests = [],
    loading,
    respondToRequest,
    cancelRequest
  } = friendRequestsHook;

  // Safely get users hook
  let usersHook;
  try {
    usersHook = useUsers();
  } catch (error) {
    console.error('Error in useUsers:', error);
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error loading user data. Please refresh the page.</p>
      </div>
    );
  }

  const { getUserById } = usersHook;
  
  if (loading) {
    return (
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-700">Loading friend requests...</p>
      </div>
    );
  }

  const handleAccept = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      if (respondToRequest) {
        await respondToRequest(requestId, 1); // 1 = accepted
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      if (respondToRequest) {
        await respondToRequest(requestId, 2); // 2 = rejected
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    try {
      if (cancelRequest) {
        await cancelRequest(requestId);
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Failed to cancel friend request. Please try again.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const totalRequests = (incomingRequests?.length || 0) + (outgoingRequests?.length || 0);

  // Don't show section if no requests
  if (totalRequests === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Incoming Requests */}
      {incomingRequests && incomingRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Friend Requests ({incomingRequests.length})
          </h3>
          <div className="space-y-3">
            {incomingRequests.map((request) => {
              if (!request || !request.id || !request.from) {
                return null;
              }

              const user = getUserById ? getUserById(request.from) : null;
              if (!user) {
                return (
                  <div key={request.id} className="bg-white p-3 rounded-lg shadow-sm border">
                    <p className="text-gray-500">Loading user information...</p>
                  </div>
                );
              }
              
              return (
                <div key={request.id} className="bg-white p-3 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-grow">
                      <UserAvatar user={user} showActiveStatus={false} />
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">
                          Sent {request.sentAt ? new Date(request.sentAt.toDate()).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={processingRequests.has(request.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingRequests.has(request.id) ? "Accepting..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingRequests.has(request.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingRequests.has(request.id) ? "Declining..." : "Decline"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing Requests - Collapsible */}
      {outgoingRequests && outgoingRequests.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <button
            onClick={() => setShowOutgoing(!showOutgoing)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-gray-700">
              Sent Requests ({outgoingRequests.length})
            </h3>
            {showOutgoing ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {showOutgoing && (
            <div className="mt-3 space-y-3">
              {outgoingRequests.map((request) => {
                if (!request || !request.id || !request.to) {
                  return null;
                }

                const user = getUserById ? getUserById(request.to) : null;
                if (!user) {
                  return (
                    <div key={request.id} className="bg-white p-3 rounded-lg shadow-sm border">
                      <p className="text-gray-500">Loading user information...</p>
                    </div>
                  );
                }
                
                return (
                  <div key={request.id} className="bg-white p-3 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-grow">
                        <UserAvatar user={user} showActiveStatus={false} />
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">
                            Sent {request.sentAt ? new Date(request.sentAt.toDate()).toLocaleDateString() : 'Recently'}
                          </p>
                          <p className="text-xs text-yellow-600">Pending response</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCancel(request.id)}
                          disabled={processingRequests.has(request.id)}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequests.has(request.id) ? "Canceling..." : "Cancel"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}