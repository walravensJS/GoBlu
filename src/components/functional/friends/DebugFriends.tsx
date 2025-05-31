import React from 'react';
import { useFriends } from '../../../services/friends/useFriends';
import { useFriendRequests } from '../../../services/friends/useFriendRequests';
import { auth } from '../../../firebase/firebase';

export function DebugFriends() {
  const { friends, friendIds, loading: friendsLoading } = useFriends();
  const { incomingRequests, outgoingRequests, loading: requestsLoading } = useFriendRequests();
  const currentUserId = auth.currentUser?.uid;

  if (friendsLoading || requestsLoading) {
    return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">Loading debug info...</div>;
  }

  return (
    <div className="p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="font-bold text-lg mb-3">🐛 Debug Information</h3>
      
      <div className="space-y-4 text-sm">
        <div>
          <strong>Current User ID:</strong> <code className="bg-gray-200 px-1 rounded">{currentUserId}</code>
        </div>
        
        <div>
          <strong>Friend IDs ({friendIds.length}):</strong>
          <div className="mt-1">
            {friendIds.length > 0 ? (
              <ul className="list-disc list-inside">
                {friendIds.map(id => (
                  <li key={id}><code className="bg-gray-200 px-1 rounded">{id}</code></li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">No friend IDs</span>
            )}
          </div>
        </div>
        
        <div>
          <strong>Friends with Details ({friends.length}):</strong>
          <div className="mt-1">
            {friends.length > 0 ? (
              <ul className="list-disc list-inside">
                {friends.map(friend => (
                  <li key={friend.id}>
                    <code className="bg-gray-200 px-1 rounded">{friend.id}</code> - {friend.displayName} ({friend.email})
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">No friends with details</span>
            )}
          </div>
        </div>
        
        <div>
          <strong>Incoming Requests ({incomingRequests.length}):</strong>
          <div className="mt-1">
            {incomingRequests.length > 0 ? (
              <ul className="list-disc list-inside">
                {incomingRequests.map(req => (
                  <li key={req.id}>
                    From: <code className="bg-gray-200 px-1 rounded">{req.from}</code> 
                    {' '}Status: {req.status}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">No incoming requests</span>
            )}
          </div>
        </div>
        
        <div>
          <strong>Outgoing Requests ({outgoingRequests.length}):</strong>
          <div className="mt-1">
            {outgoingRequests.length > 0 ? (
              <ul className="list-disc list-inside">
                {outgoingRequests.map(req => (
                  <li key={req.id}>
                    To: <code className="bg-gray-200 px-1 rounded">{req.to}</code>
                    {' '}Status: {req.status}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">No outgoing requests</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}