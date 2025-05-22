import React from 'react';
import { User } from '../../types/user';
import { UserCard } from './UserCard';

interface UserListProps {
  users: User[];
  isSearching: boolean;
  friendIds: Set<string>;
  onAddFriend: (userId: string) => void;
}

export function UserList({ 
  users, 
  isSearching, 
  friendIds, 
  onAddFriend 
}: UserListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {users.map((user) => {
        const isAlreadyFriend = friendIds.has(user.id);
        
        return (
          <UserCard
            key={user.id}
            user={user}
            isSearching={isSearching}
            isAlreadyFriend={isAlreadyFriend}
            onAddFriend={onAddFriend}
          />
        );
      })}
    </div>
  );
}