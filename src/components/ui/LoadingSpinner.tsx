// src/components/ui/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-20">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"
        role="status"
        aria-label="Loading..."
      ></div>
    </div>
  );
};

export default LoadingSpinner;
