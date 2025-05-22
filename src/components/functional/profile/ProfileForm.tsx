import React, { type FormEvent, type ChangeEvent } from 'react';
import { type User } from "firebase/auth";
import { Save } from 'lucide-react';
import { MessageDisplay } from './MessageDisplay';

interface ProfileFormProps {
  user: User;
  displayName: string;
  onDisplayNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
  message: string;
  error: string | null;
}

export function ProfileForm({
  user,
  displayName,
  onDisplayNameChange,
  onSubmit,
  loading,
  message,
  error
}: ProfileFormProps) {
  return (
    <div className="md:w-2/3">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={onDisplayNameChange}
            className="w-full p-3 rounded-md text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
            {user.email}
          </div>
        </div>

        <MessageDisplay message={message} error={error} />

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              <span className="flex items-center">
                <Save size={16} className="mr-2" />
                Save Changes
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
