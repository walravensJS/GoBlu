import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface MessageDisplayProps {
  message: string;
  error: string | null;
}

export function MessageDisplay({ message, error }: MessageDisplayProps) {
  if (!message && !error) return null;

  return (
    <>
      {message && (
        <div className="flex items-center bg-green-50 text-green-700 p-3 rounded-md">
          <CheckCircle size={18} className="mr-2" />
          {message}
        </div>
      )}
      
      {error && (
        <div className="flex items-center bg-red-50 text-red-700 p-3 rounded-md">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      )}
    </>
  );
}
