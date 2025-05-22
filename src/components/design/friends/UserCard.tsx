import React from 'react';
import { Link } from "react-router-dom";
import { type User } from '../../../services/types';
import { UserAvatar } from '../../functional/friends/UserAvatar';

interface UserCardProps {
  user: User;
  isSearching: boolean;
  isAlreadyFriend: boolean;
  onAddFriend: (userId: string) => void;
}

export function UserCard({ 
  user, 
  isSearching, 
  isAlreadyFriend, 
  onAddFriend 
}: UserCardProps) {
  const showActiveStatus = !isSearching && user.isActive !== undefined;

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-100">
      <Link
        to={`/users/${user.id}`}
        className="flex items-center flex-grow mb-2 sm:mb-0 sm:mr-2 w-full"
      >
        <UserAvatar user={user} showActiveStatus={showActiveStatus} />
        <div className="ml-4 flex-grow min-w-0">
          {isSearching && user.email && (
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          )}
        </div>
      </Link>

      {/* Action buttons */}
      {isSearching && !isAlreadyFriend && (
        <button
          onClick={() => onAddFriend(user.id)}
          className="mt-2 sm:mt-0 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm self-start sm:self-center whitespace-nowrap flex-shrink-0"
        >
          Add Friend
        </button>
      )}
      {isSearching && isAlreadyFriend && (
        <span className="mt-2 sm:mt-0 px-3 py-1.5 text-xs text-gray-500 self-start sm:self-center whitespace-nowrap flex-shrink-0">
          Friends
        </span>
      )}
    </div>
  );
}