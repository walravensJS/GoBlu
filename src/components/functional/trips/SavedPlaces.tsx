import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Phone, Globe, ExternalLink, Trash2, Eye } from 'lucide-react';

interface SavedPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  savedAt: number;
  rating?: number;
  price_level?: number;
  photo_reference?: string;
  formatted_phone_number?: string;
  website?: string;
}

interface SavedPlacesProps {
  places: SavedPlace[];
  type: 'hotels' | 'restaurants' | 'activities';
  onRemove: (placeId: string) => void;
  tripId?: string;
}

export function SavedPlaces({ places, type, onRemove, tripId }: SavedPlacesProps) {
  const getPhotoUrl = (photoRef: string) => {
    if (!photoRef) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`;
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

  const typeLabels = {
    hotels: 'Hotels',
    restaurants: 'Restaurants',
    activities: 'Activities'
  };

  const typeColors = {
    hotels: 'blue',
    restaurants: 'green',
    activities: 'purple'
  };

  const color = typeColors[type];

  if (places.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className={`text-lg font-semibold mb-4 text-${color}-600`}>
          Saved {typeLabels[type]} (0)
        </h3>
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No {type} saved yet.</p>
          <p className="text-sm text-gray-400">Browse and save places from the {typeLabels[type]} tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className={`text-lg font-semibold mb-4 text-${color}-600`}>
        Saved {typeLabels[type]} ({places.length})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((place) => (
          <div key={place.place_id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition">
            {place.photo_reference ? (
              <img
                src={getPhotoUrl(place.photo_reference)}
                alt={place.name}
                className="w-full h-40 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-500" />
              </div>
            )}
            
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{place.name}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{place.formatted_address}</p>
              
              {place.rating && (
                <div className="mb-3">
                  {renderStars(place.rating)}
                </div>
              )}

              <div className="space-y-2 mb-4">
                {place.formatted_phone_number && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-3 h-3 mr-2 flex-shrink-0" />
                    <a href={`tel:${place.formatted_phone_number}`} className="hover:text-blue-600 truncate">
                      {place.formatted_phone_number}
                    </a>
                  </div>
                )}
                
                {place.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-3 h-3 mr-2 flex-shrink-0" />
                    <a 
                      href={place.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 truncate flex items-center"
                    >
                      Website
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {tripId && (
                  <Link
                    to={`/trips/${tripId}/place/${place.place_id}/${type}`}
                    className="flex-1 py-2 px-3 bg-white border border-gray-300 text-gray-700 rounded text-center text-sm hover:bg-gray-50 transition flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Link>
                )}
                
                <button
                  onClick={() => onRemove(place.place_id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition flex items-center justify-center"
                  title="Remove from trip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}