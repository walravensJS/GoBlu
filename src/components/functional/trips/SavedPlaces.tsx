// src/components/functional/trips/SavedPlaces.tsx
import React from 'react';
import { Star, Phone, Globe, ExternalLink, Trash2, MapPin } from 'lucide-react';

interface SavedPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  photo_reference?: string;
  formatted_phone_number?: string;
  website?: string;
  savedAt: number;
}

interface SavedPlacesProps {
  places: SavedPlace[];
  type: 'hotels' | 'restaurants' | 'activities';
  onRemove: (placeId: string) => void;
}

export function SavedPlaces({ places, type, onRemove }: SavedPlacesProps) {
  const getPhotoUrl = (photoRef: string) => {
    if (!photoRef) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${photoRef}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}</span>
      </div>
    );
  };

  const getTypeColor = () => {
    switch (type) {
      case 'hotels': return 'blue';
      case 'restaurants': return 'green';
      case 'activities': return 'purple';
      default: return 'gray';
    }
  };

  const color = getTypeColor();

  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">No saved {type} yet</p>
        <p className="text-gray-400 text-sm">Browse and save places to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Your Saved {type.charAt(0).toUpperCase() + type.slice(1)} ({places.length})
        </h3>
        <span className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm`}>
          {places.length} saved
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {places.map((place) => (
          <div key={place.place_id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {place.photo_reference && (
                <div className="flex-shrink-0">
                  <img
                    src={getPhotoUrl(place.photo_reference)}
                    alt={place.name}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{place.name}</h4>
                  <button
                    onClick={() => onRemove(place.place_id)}
                    className="text-red-400 hover:text-red-600 p-1 ml-2 flex-shrink-0"
                    title="Remove from trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{place.formatted_address}</p>
                
                {place.rating && (
                  <div className="mb-2">
                    {renderStars(place.rating)}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {place.formatted_phone_number && (
                    <a
                      href={`tel:${place.formatted_phone_number}`}
                      className="flex items-center hover:text-blue-600"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </a>
                  )}
                  
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-blue-600"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Website
                      <ExternalLink className="w-2 h-2 ml-1" />
                    </a>
                  )}
                  
                  <span className="text-gray-400">
                    Saved {new Date(place.savedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}