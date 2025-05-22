import React from 'react';
import { type User } from '../../../services/types';

interface UserAvatarProps {
  user: User;
  showActiveStatus: boolean;
}

export function UserAvatar({ user, showActiveStatus }: UserAvatarProps) {
  return (
    <div className="flex items-center">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || "User"}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
          {user.displayName?.charAt(0).toUpperCase() || "U"}
        </div>
      )}
      <div className="ml-4 flex-grow min-w-0">
        <div className="flex items-center">
          <h3 className="font-medium truncate">
            {user.displayName || "Anonymous User"}
          </h3>
          {showActiveStatus && (
            <div
              className={`w-2.5 h-2.5 rounded-full ml-2 flex-shrink-0 ${
                user.isActive ? "bg-green-500" : "bg-gray-400"
              }`}
            ></div>
          )}
        </div>
      </div>
    </div>
  );
}
