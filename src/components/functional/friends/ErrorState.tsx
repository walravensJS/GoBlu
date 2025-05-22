import React from 'react';

interface ErrorStateProps {
  error: Error;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto text-red-500">
        <p>Error: {error.message}</p>
      </div>
    </div>
  );
}