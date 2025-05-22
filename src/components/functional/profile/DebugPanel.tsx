import React, { useState } from 'react';
import { type User } from "firebase/auth";

interface DebugPanelProps {
  user: User;
}

export function DebugPanel({ user }: DebugPanelProps): JSX.Element | null {
  const [copied, setCopied] = useState(false);

  if (process.env.NODE_ENV === 'production') return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy UID", err);
    }
  };

  return (
    <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">Your Unique Friend Code</h2>
      <p className="text-xs text-gray-500 mb-3">Share this with a friend so they can add you.</p>
      
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 text-xs bg-gray-100 rounded text-gray-800 break-all">{user.uid}</div>
        <button
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
