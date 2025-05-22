import React from 'react';

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
}

export function SearchInput({ searchTerm, onSearchChange, isSearching }: SearchInputProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            isSearching
              ? "Search all users (name, email, ID)..."
              : "Search your friends..."
          }
          className="w-full p-3 pl-10 border rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
        />
        <svg
          className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
