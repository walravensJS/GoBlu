import React from 'react';

interface EmptyStateProps {
  isSearching: boolean;
  friendsCount: number;
  onFindPeople: () => void;
}

export function EmptyState({ isSearching, friendsCount, onFindPeople }: EmptyStateProps) {
  return (
    <div className="text-center py-10">
      <p className="text-gray-500 mb-2">
        {isSearching
          ? "No users match your search."
          : "You don't have any friends yet. Try searching for people to add!"}
      </p>
      {!isSearching && friendsCount === 0 && (
        <button
          onClick={onFindPeople}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Find People
        </button>
      )}
    </div>
  );
}
