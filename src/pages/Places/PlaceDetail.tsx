import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../../firebase/firebase';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Phone, 
  Globe, 
  Clock, 
  DollarSign, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Calendar,
  Users,
  Navigation
} from 'lucide-react';
import { useGoogleMaps } from '../../components/providers/GoogleMapsProvider';

interface Trip {
  id: string;
  title: string;
  description: string;
  location: string;
  from: { seconds: number };
  until: { seconds: number };
  imageUrl: string;
  userId?: string;
  savedHotels?: SavedPlace[];
  savedRestaurants?: SavedPlace[];
  savedActivities?: SavedPlace[];
}

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

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{ photo_reference: string }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
  }>;
  types: string[];
  url?: string;
  vicinity?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function PlaceDetail() {
  const { tripId, placeId, type } = useParams<{ 
    tripId: string; 
    placeId: string; 
    type: 'hotels' | 'restaurants' | 'activities' 
  }>();
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!tripId || !placeId || !type) return;
      
      try {
        // Fetch trip data
        const tripDoc = await getDoc(doc(db, COLLECTIONS.TRIPS, tripId));
        if (tripDoc.exists()) {
          const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip;
          
          if (tripData.userId !== auth.currentUser?.uid) {
            navigate('/dashboard');
            return;
          }
          
          setTrip(tripData);
        }

        // Fetch place details from Google Places API
        if (window.google && isLoaded) {
          const service = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );

          const request = {
            placeId: placeId,
            fields: [
              'place_id',
              'name',
              'formatted_address',
              'formatted_phone_number',
              'website',
              'rating',
              'price_level',
              'opening_hours',
              'photos',
              'reviews',
              'types',
              'url',
              'vicinity',
              'geometry'
            ]
          };

          service.getDetails(request, (result, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
              setPlace({
                place_id: result.place_id!,
                name: result.name!,
                formatted_address: result.formatted_address!,
                formatted_phone_number: result.formatted_phone_number,
                website: result.website,
                rating: result.rating,
                price_level: result.price_level,
                opening_hours: result.opening_hours,
                photos: result.photos?.map(photo => ({ photo_reference: photo.photo_reference })),
                reviews: result.reviews?.map(review => ({
                  author_name: review.author_name,
                  rating: review.rating,
                  text: review.text,
                  time: review.time,
                  profile_photo_url: review.profile_photo_url
                })),
                types: result.types || [],
                url: result.url,
                vicinity: result.vicinity,
                geometry: result.geometry ? {
                  location: {
                    lat: result.geometry.location!.lat(),
                    lng: result.geometry.location!.lng()
                  }
                } : undefined
              });
            }
            setLoading(false);
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId, placeId, type, navigate, isLoaded]);

  const getPhotoUrl = (photoRef: string, maxWidth = 800) => {
    if (!photoRef) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`;
  };

  const isPlaceSaved = (): boolean => {
    if (!trip || !place || !type) return false;
    
    const fieldMap = {
      hotels: 'savedHotels',
      restaurants: 'savedRestaurants',
      activities: 'savedActivities'
    };

    const savedPlaces = trip[fieldMap[type]] || [];
    return savedPlaces.some(p => p.place_id === place.place_id);
  };

  const removeUndefinedValues = (obj: any): any => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  const toggleSavePlace = async () => {
    if (!trip || !place || !type) return;

    setSaving(true);
    const isSaved = isPlaceSaved();

    const fieldMap = {
      hotels: 'savedHotels',
      restaurants: 'savedRestaurants',
      activities: 'savedActivities'
    };

    try {
      if (isSaved) {
        // Remove from saved places
        const savedPlaces = trip[fieldMap[type]] || [];
        const placeToRemove = savedPlaces.find(p => p.place_id === place.place_id);

        if (placeToRemove) {
          await updateDoc(doc(db, COLLECTIONS.TRIPS, trip.id), {
            [fieldMap[type]]: arrayRemove(placeToRemove)
          });

          setTrip(prev => prev ? {
            ...prev,
            [fieldMap[type]]: savedPlaces.filter(p => p.place_id !== place.place_id)
          } : prev);
        }
      } else {
        // Add to saved places
        const savedPlaceData = {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          rating: place.rating,
          price_level: place.price_level,
          photo_reference: place.photos?.[0]?.photo_reference,
          formatted_phone_number: place.formatted_phone_number,
          website: place.website,
          savedAt: Date.now()
        };

        const savedPlace = removeUndefinedValues(savedPlaceData) as SavedPlace;

        await updateDoc(doc(db, COLLECTIONS.TRIPS, trip.id), {
          [fieldMap[type]]: arrayUnion(savedPlace)
        });

        setTrip(prev => prev ? {
          ...prev,
          [fieldMap[type]]: [...(prev[fieldMap[type]] || []), savedPlace]
        } : prev);
      }
    } catch (error) {
      console.error('Error toggling save place:', error);
      alert('Failed to update saved places. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-medium">{rating}</span>
      </div>
    );
  };

  const renderPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return null;
    return (
      <div className="flex items-center">
        <span className="text-gray-600 mr-1">Price:</span>
        {[...Array(4)].map((_, i) => (
          <DollarSign
            key={i}
            className={`w-4 h-4 ${
              i < priceLevel ? 'text-green-600' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getDirectionsUrl = () => {
    if (!place?.geometry) return null;
    const { lat, lng } = place.geometry.location;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <p className="text-xl">Loading place details...</p>
        </div>
      </div>
    );
  }

  if (!trip || !place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Place not found</p>
          <Link 
            to={`/trips/${tripId}`}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Back to Trip
          </Link>
        </div>
      </div>
    );
  }

  const typeLabels = {
    hotels: 'Hotel',
    restaurants: 'Restaurant',
    activities: 'Activity'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={`/trips/${tripId}`}
              className="flex items-center text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to {trip.title}
            </Link>
            
            <button
              onClick={toggleSavePlace}
              disabled={saving}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition ${
                isPlaceSaved()
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPlaceSaved() ? (
                <>
                  <BookmarkCheck className="w-5 h-5 mr-2" />
                  Remove from Trip
                </>
              ) : (
                <>
                  <Bookmark className="w-5 h-5 mr-2" />
                  Save to Trip
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {place.photos && place.photos.length > 0 ? (
              <div className="relative h-96">
                <img
                  src={getPhotoUrl(place.photos[0].photo_reference, 1200)}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <span className="inline-block bg-purple-600 px-3 py-1 rounded-full text-sm mb-2">
                    {typeLabels[type!]}
                  </span>
                  <h1 className="text-4xl font-bold mb-2">{place.name}</h1>
                  <p className="text-lg opacity-90 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {place.formatted_address}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-96 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm mb-4">
                    {typeLabels[type!]}
                  </span>
                  <h1 className="text-4xl font-bold mb-2">{place.name}</h1>
                  <p className="text-lg opacity-90 flex items-center justify-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    {place.formatted_address}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">Quick Information</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {place.rating && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">Rating</h3>
                        {renderStars(place.rating)}
                      </div>
                    )}
                    
                    {place.price_level !== undefined && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">Price Range</h3>
                        {renderPriceLevel(place.price_level)}
                      </div>
                    )}

                    {place.types && place.types.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {place.types.slice(0, 5).map(type => (
                            <span 
                              key={type}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                            >
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {place.formatted_phone_number && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">Phone</h3>
                        <a 
                          href={`tel:${place.formatted_phone_number}`}
                          className="flex items-center text-purple-600 hover:text-purple-700"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          {place.formatted_phone_number}
                        </a>
                      </div>
                    )}

                    {place.website && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">Website</h3>
                        <a 
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-purple-600 hover:text-purple-700"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Website
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}

                    {getDirectionsUrl() && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-1">Directions</h3>
                        <a 
                          href={getDirectionsUrl()!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-purple-600 hover:text-purple-700"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              {place.opening_hours && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Clock className="w-6 h-6 mr-2" />
                    Opening Hours
                  </h2>
                  
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      place.opening_hours.open_now 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                    </span>
                  </div>

                  {place.opening_hours.weekday_text && (
                    <div className="space-y-2">
                      {place.opening_hours.weekday_text.map((day, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="font-medium">{day.split(': ')[0]}:</span>
                          <span>{day.split(': ')[1]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews */}
              {place.reviews && place.reviews.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-6">Reviews</h2>
                  
                  <div className="space-y-6">
                    {place.reviews.slice(0, 3).map((review, index) => (
                      <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start space-x-4">
                          {review.profile_photo_url ? (
                            <img
                              src={review.profile_photo_url}
                              alt={review.author_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{review.author_name}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(review.time * 1000).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed">{review.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Photo Gallery */}
              {place.photos && place.photos.length > 1 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h3 className="text-lg font-bold mb-4">Photos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {place.photos.slice(1, 5).map((photo, index) => (
                      <img
                        key={index}
                        src={getPhotoUrl(photo.photo_reference, 400)}
                        alt={`${place.name} photo ${index + 2}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                  {place.photos.length > 5 && (
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      +{place.photos.length - 5} more photos
                    </p>
                  )}
                </div>
              )}

              {/* Trip Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Trip Details
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Trip:</span>
                    <p className="text-gray-600">{trip.title}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Destination:</span>
                    <p className="text-gray-600">{trip.location}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Dates:</span>
                    <p className="text-gray-600">
                      {new Date(trip.from.seconds * 1000).toLocaleDateString()} - {new Date(trip.until.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>

                  {isPlaceSaved() && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center text-green-700">
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Saved to your trip</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}