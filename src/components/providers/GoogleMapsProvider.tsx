// src/components/providers/GoogleMapsProvider.tsx
import React, { createContext, useContext, useState } from 'react';
import { LoadScript } from '@react-google-maps/api';

const libraries: ("places")[] = ['places'];

interface GoogleMapsContextType {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_API_KEY}
      libraries={libraries}
      onLoad={() => setIsLoaded(true)}
      onError={(error) => {
        console.error('Google Maps failed to load:', error);
        setIsLoaded(false);
      }}
      loadingElement={
        <div className="w-full h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading Google Maps...</p>
          </div>
        </div>
      }
    >
      <GoogleMapsContext.Provider value={{ isLoaded }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
}