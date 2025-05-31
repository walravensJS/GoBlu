import React from 'react';
import { SearchInput } from '../../components/functional/friends/SearchInput';
import { UserList } from '../../components/design/friends/UserList';
import { EmptyState } from '../../components/functional/friends/EmptyState';
import { LoadingState } from '../../components/functional/friends/LoadingState';
import { ErrorState } from '../../components/functional/friends/ErrorState';
import { useFriendsLogic } from '../../hooks/useFriendsLogic';
import { useFriendRequests } from "../../hooks/useFriendRequests";
import { updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase";
import { useUserById } from "../../hooks/useUserById"; 
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";


function FriendListItem({ uid, requestId }: { uid: string; requestId: string }) {
  const { user, loading } = useUserById(uid);
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.length > 1
      ? names[0][0].toUpperCase() + names[1][0].toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };


  return (
    <li key={requestId} className="bg-white shadow p-4 rounded">
      {loading ? (
        "Loading..."
      ) : (
        <Link
        to={`/users/${user.id}`}
          className="flex items-center space-x-4 focus:outline-none"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.displayName}'s avatar`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-semibold">
              {user?.displayName ? getInitials(user.displayName) : "NA"}
            </div>
          )}
          <span>{user?.displayName || uid}</span>
        </Link>
      )}
    </li>
  );
}


export default function Friends() {
  const currentUser = auth.currentUser;

  const {
    incoming,
    outgoing,
    accepted,
    loading: requestLoading,
    error: requestError,
  } = useFriendRequests();

  const {
    searchTerm,
    setSearchTerm,
    isSearching,
    displayItems,
    friendIds,
    friends,
    currentLoading,
    currentError,
    handleAddFriend,
    handleFindPeople,
  } = useFriendsLogic();

  if (currentLoading) {
    return <LoadingState />;
  }

  if (currentError) {
    return <ErrorState error={currentError} />;
  }

  const handleAccept = async (requestId: string) => {
    const ref = doc(db, "friendRequests", requestId);
    await updateDoc(ref, { status: 1 });
  };
  
  const handleReject = async (requestId: string) => {
    const ref = doc(db, "friendRequests", requestId);
    await updateDoc(ref, { status: 2 });
  };


  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>

        <SearchInput
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isSearching={isSearching}
        />

        {displayItems.length === 0 ? (
          <EmptyState
            isSearching={isSearching}
            friendsCount={friends.length}
            onFindPeople={handleFindPeople}
          />
        ) : (
          <UserList
            users={displayItems}
            isSearching={isSearching}
            friendIds={friendIds}
            onAddFriend={handleAddFriend}
          />
        )}
      </div>
      {/* PENDING REQUESTS */}
{incoming.length > 0 && (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-2">Friend Requests</h2>
    <ul className="space-y-4">
      {incoming.map((req) => (
        <li key={req.id} className="flex items-center justify-between bg-white shadow p-4 rounded">
          <span>{req.from}</span> {/* You can fetch user info for nicer UI */}
          <div className="space-x-2">
            <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => handleAccept(req.id)}>
              Accept
            </button>
            <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => handleReject(req.id)}>
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

{/* FRIENDS LIST (ACCEPTED REQUESTS) */}
{accepted.length > 0 && (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-2">Your Friends</h2>
    <ul className="space-y-4">
    {accepted.map((req) => {
  const friendId = req.from === currentUser.uid ? req.to : req.from;
  return <FriendListItem key={req.id} uid={friendId} requestId={req.id} />;
})}

    </ul>
  </div>
)}

    </div>
  );
}