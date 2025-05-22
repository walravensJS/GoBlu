import React from 'react';

export function LoadingState() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-40 mt-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}