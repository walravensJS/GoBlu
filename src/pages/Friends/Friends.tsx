import React from 'react';
import { SearchInput } from '../../components/functional/friends/SearchInput';
import { UserList } from '../../components/design/friends/UserList';
import { EmptyState } from '../../components/functional/friends/EmptyState';
import { LoadingState } from '../../components/functional/friends/LoadingState';
import { ErrorState } from '../../components/functional/friends/ErrorState';
import { FriendRequestsSection } from '../../components/functional/friends/FriendRequestsSection';
import { DebugFriends } from '../../components/functional/friends/DebugFriends';
import { useFriendsLogic } from '../../hooks/useFriendsLogic';


export default function Friends() {
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

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>

        {/* Debug Section - Remove this in production */}
        <DebugFriends />

        {/* Friend Requests Section - only shown when not searching */}
        {!isSearching && <FriendRequestsSection />}

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
    </div>
  );
}