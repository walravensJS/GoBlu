import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../../firebase/firebase';
import { MapPin, Calendar, Clock, ArrowLeft, Edit, Trash2, Star, Phone, Globe, DollarSign, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';
import { useGoogleMaps } from '../../components/providers/GoogleMapsProvider';
import { SavedPlaces } from '../../components/functional/trips/SavedPlaces';

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

interface PlaceData {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  photos?: Array<{ photo_reference: string }>;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  types: string[];
}

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [hotels, setHotels] = useState<PlaceData[]>([]);
  const [restaurants, setRestaurants] = useState<PlaceData[]>([]);
  const [activities, setActivities] = useState<PlaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'hotels' | 'restaurants' | 'activities' | 'saved'>('overview');
  const [placesLoading, setPlacesLoading] = useState(false);

  // Helper function to remove undefined values from an object
  const removeUndefinedValues = (obj: any): any => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const cleanedNested = removeUndefinedValues(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      
      try {
        const tripDoc = await getDoc(doc(db, COLLECTIONS.TRIPS, tripId));
        if (tripDoc.exists()) {
          const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip;
          
          // Check if current user owns this trip
          if (tripData.userId !== auth.currentUser?.uid) {
            navigate('/dashboard');
            return;
          }
          
          // Initialize saved places arrays if they don't exist
          if (!tripData.savedHotels) tripData.savedHotels = [];
          if (!tripData.savedRestaurants) tripData.savedRestaurants = [];
          if (!tripData.savedActivities) tripData.savedActivities = [];
          
          setTrip(tripData);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching trip:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, navigate]);

  const searchPlaces = async (type: 'lodging' | 'restaurant' | 'tourist_attraction') => {
    if (!trip || !window.google || !isLoaded) return;

    setPlacesLoading(true);
    
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    const request = {
      query: `${type} in ${trip.location}`,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'rating',
        'price_level',
        'photos',
        'formatted_phone_number',
        'website',
        'opening_hours',
        'types'
      ]
    };

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const places = results.slice(0, 12).map(place => ({
          place_id: place.place_id!,
          name: place.name!,
          formatted_address: place.formatted_address!,
          rating: place.rating,
          price_level: place.price_level,
          photos: place.photos?.map(photo => ({ photo_reference: photo.photo_reference })),
          formatted_phone_number: place.formatted_phone_number,
          website: place.website,
          opening_hours: place.opening_hours,
          types: place.types || []
        }));

        if (type === 'lodging') setHotels(places);
        else if (type === 'restaurant') setRestaurants(places);
        else if (type === 'tourist_attraction') setActivities(places);
      }
      setPlacesLoading(false);
    });
  };

  const handleDeleteTrip = async () => {
    if (!trip || !window.confirm('Are you sure you want to delete this trip?')) return;

    try {
      await deleteDoc(doc(db, COLLECTIONS.TRIPS, trip.id));
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip.');
    }
  };

  const getPhotoUrl = (photoRef: string) => {
    if (!photoRef) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`;
  };

  const savePlace = async (place: PlaceData, type: 'hotels' | 'restaurants' | 'activities') => {
    if (!trip) {
      console.error('No trip data available');
      alert('No trip data available. Please refresh the page.');
      return;
    }

    if (!auth.currentUser) {
      console.error('User not authenticated');
      alert('You must be logged in to save places.');
      return;
    }

    console.log('Saving place:', { place: place.name, type, tripId: trip.id });

    // Create savedPlace object and filter out undefined values
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

    // Remove undefined values to prevent Firestore errors
    const savedPlace: SavedPlace = Object.fromEntries(
      Object.entries(savedPlaceData).filter(([_, value]) => value !== undefined)
    ) as SavedPlace;

    const fieldMap = {
      hotels: 'savedHotels',
      restaurants: 'savedRestaurants',
      activities: 'savedActivities'
    };

    try {
      console.log('Attempting to update document:', trip.id);
      console.log('Field being updated:', fieldMap[type]);
      console.log('Data being saved:', savedPlace);

      // Try arrayUnion first
      try {
        await updateDoc(doc(db, COLLECTIONS.TRIPS, trip.id), {
          [fieldMap[type]]: arrayUnion(savedPlace)
        });
      } catch (arrayUnionError) {
        console.log('arrayUnion failed, trying alternative approach:', arrayUnionError);
        
        // Alternative approach: get current data and update manually
        const tripDocRef = doc(db, COLLECTIONS.TRIPS, trip.id);
        const tripDoc = await getDoc(tripDocRef);
        
        if (!tripDoc.exists()) {
          throw new Error('Trip document not found');
        }
        
        const currentData = tripDoc.data();
        const currentPlaces = currentData[fieldMap[type]] || [];
        
        // Check if place is already saved
        const alreadySaved = currentPlaces.some((p: SavedPlace) => p.place_id === savedPlace.place_id);
        if (alreadySaved) {
          alert('This place is already saved to your trip!');
          return;
        }
        
        // Clean the data before saving
        const cleanedData = removeUndefinedValues({
          ...currentData,
          [fieldMap[type]]: [...currentPlaces, savedPlace]
        });
        
        await setDoc(tripDocRef, cleanedData);
      }

      console.log('Successfully saved place to Firestore');

      // Update local state
      setTrip(prev => prev ? {
        ...prev,
        [fieldMap[type]]: [...(prev[fieldMap[type]] || []), savedPlace]
      } : prev);

      alert(`${place.name} saved to your trip!`);
    } catch (error: any) {
      console.error('Detailed error saving place:', {
        error: error,
        code: error.code,
        message: error.message,
        tripId: trip.id,
        userId: auth.currentUser?.uid,
        place: place.name
      });
      
      // More specific error messages
      if (error.code === 'permission-denied') {
        alert('Permission denied. You may not own this trip or your session may have expired.');
      } else if (error.code === 'not-found') {
        alert('Trip not found. The trip may have been deleted.');
      } else if (error.code === 'unauthenticated') {
        alert('You are not authenticated. Please log in again.');
      } else {
        alert(`Failed to save place: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const removePlace = async (placeId: string, type: 'hotels' | 'restaurants' | 'activities') => {
    if (!trip) return;

    const fieldMap = {
      hotels: 'savedHotels',
      restaurants: 'savedRestaurants',
      activities: 'savedActivities'
    };

    const savedPlaces = trip[fieldMap[type]] || [];
    const placeToRemove = savedPlaces.find(p => p.place_id === placeId);

    if (!placeToRemove) return;

    try {
      await updateDoc(doc(db, COLLECTIONS.TRIPS, trip.id), {
        [fieldMap[type]]: arrayRemove(placeToRemove)
      });

      // Update local state
      setTrip(prev => prev ? {
        ...prev,
        [fieldMap[type]]: savedPlaces.filter(p => p.place_id !== placeId)
      } : prev);

      alert('Place removed from your trip!');
    } catch (error) {
      console.error('Error removing place:', error);
      alert('Failed to remove place. Please try again.');
    }
  };

  const isPlaceSaved = (placeId: string, type: 'hotels' | 'restaurants' | 'activities'): boolean => {
    if (!trip) return false;
    
    const fieldMap = {
      hotels: 'savedHotels',
      restaurants: 'savedRestaurants',
      activities: 'savedActivities'
    };

    const savedPlaces = trip[fieldMap[type]] || [];
    return savedPlaces.some(p => p.place_id === placeId);
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

  const renderPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return null;
    return (
      <div className="flex items-center">
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

  const PlaceCard = ({ place, type }: { place: PlaceData; type: 'hotels' | 'restaurants' | 'activities' }) => {
    const isSaved = isPlaceSaved(place.place_id, type);
    const photoUrl = place.photos?.[0]?.photo_reference ? getPhotoUrl(place.photos[0].photo_reference) : null;

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {photoUrl ? (
          <div className="relative">
            <img
              src={photoUrl}
              alt={place.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                // Hide broken images
                e.currentTarget.style.display = 'none';
              }}
            />
            <button
              onClick={() => isSaved ? removePlace(place.place_id, type) : savePlace(place, type)}
              className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-colors ${
                isSaved 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">No image available</p>
            </div>
            <button
              onClick={() => isSaved ? removePlace(place.place_id, type) : savePlace(place, type)}
              className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-colors ${
                isSaved 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">{place.name}</h3>
            {isSaved && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex-shrink-0">
                Saved
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{place.formatted_address}</p>
          
          <div className="flex items-center justify-between mb-3">
            {renderStars(place.rating)}
            {renderPriceLevel(place.price_level)}
          </div>

          <div className="space-y-2 mb-4">
            {place.formatted_phone_number && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <a href={`tel:${place.formatted_phone_number}`} className="hover:text-blue-600 truncate">
                  {place.formatted_phone_number}
                </a>
              </div>
            )}
            
            {place.website && (
              <div className="flex items-center text-sm text-gray-600">
                <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                <a 
                  href={place.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 truncate flex items-center"
                >
                  Visit Website
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}
            
            {place.opening_hours?.open_now !== undefined && (
              <div className="text-sm">
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  place.opening_hours.open_now 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => isSaved ? removePlace(place.place_id, type) : savePlace(place, type)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                isSaved
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaved ? 'Remove from Trip' : 'Save to Trip'}
            </button>
            
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <p className="text-white text-xl">
            {loading ? 'Loading trip details...' : 'Loading Google Maps...'}
          </p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Trip not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={trip.imageUrl}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{trip.title}</h1>
            <p className="text-xl mb-6">{trip.description}</p>
            <div className="flex items-center justify-center space-x-6 text-lg">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {trip.location}
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {new Date(trip.from.seconds * 1000).toLocaleDateString()} - {new Date(trip.until.seconds * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-4 left-4">
          <Link
            to="/dashboard"
            className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="absolute top-4 right-4 flex space-x-2">
          <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition">
            <Edit className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeleteTrip}
            className="bg-red-500 bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'hotels', label: 'Hotels' },
              { key: 'restaurants', label: 'Restaurants' },
              { key: 'activities', label: 'Activities' },
              { key: 'saved', label: `Saved (${(trip.savedHotels?.length || 0) + (trip.savedRestaurants?.length || 0) + (trip.savedActivities?.length || 0)})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  if (tab.key === 'hotels' && hotels.length === 0) {
                    searchPlaces('lodging');
                  } else if (tab.key === 'restaurants' && restaurants.length === 0) {
                    searchPlaces('restaurant');
                  } else if (tab.key === 'activities' && activities.length === 0) {
                    searchPlaces('tourist_attraction');
                  }
                }}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Trip Overview</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Trip Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                      <span>{trip.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <span>
                        {new Date(trip.from.seconds * 1000).toLocaleDateString()} - {new Date(trip.until.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-400 mr-3" />
                      <span>
                        {Math.ceil((trip.until.seconds - trip.from.seconds) / (24 * 60 * 60))} days
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{trip.description}</p>
                </div>
              </div>
            </div>

            {/* Saved Places Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Bookmark className="w-5 h-5 mr-2 text-blue-600" />
                  Saved Hotels ({trip.savedHotels?.length || 0})
                </h3>
                {trip.savedHotels && trip.savedHotels.length > 0 ? (
                  <div className="space-y-2">
                    {trip.savedHotels.slice(0, 3).map(hotel => (
                      <div key={hotel.place_id} className="text-sm border-l-2 border-blue-200 pl-3">
                        <p className="font-medium">{hotel.name}</p>
                        <p className="text-gray-600 text-xs">{hotel.formatted_address}</p>
                      </div>
                    ))}
                    {trip.savedHotels.length > 3 && (
                      <p className="text-xs text-gray-500">+{trip.savedHotels.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hotels saved yet</p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Bookmark className="w-5 h-5 mr-2 text-green-600" />
                  Saved Restaurants ({trip.savedRestaurants?.length || 0})
                </h3>
                {trip.savedRestaurants && trip.savedRestaurants.length > 0 ? (
                  <div className="space-y-2">
                    {trip.savedRestaurants.slice(0, 3).map(restaurant => (
                      <div key={restaurant.place_id} className="text-sm border-l-2 border-green-200 pl-3">
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-gray-600 text-xs">{restaurant.formatted_address}</p>
                      </div>
                    ))}
                    {trip.savedRestaurants.length > 3 && (
                      <p className="text-xs text-gray-500">+{trip.savedRestaurants.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No restaurants saved yet</p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Bookmark className="w-5 h-5 mr-2 text-purple-600" />
                  Saved Activities ({trip.savedActivities?.length || 0})
                </h3>
                {trip.savedActivities && trip.savedActivities.length > 0 ? (
                  <div className="space-y-2">
                    {trip.savedActivities.slice(0, 3).map(activity => (
                      <div key={activity.place_id} className="text-sm border-l-2 border-purple-200 pl-3">
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-gray-600 text-xs">{activity.formatted_address}</p>
                      </div>
                    ))}
                    {trip.savedActivities.length > 3 && (
                      <p className="text-xs text-gray-500">+{trip.savedActivities.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No activities saved yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hotels' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Hotels in {trip.location}</h2>
              <div className="flex gap-2">
                {trip.savedHotels && trip.savedHotels.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {trip.savedHotels.length} saved
                  </span>
                )}
                {hotels.length === 0 && (
                  <button
                    onClick={() => searchPlaces('lodging')}
                    disabled={placesLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {placesLoading ? 'Loading...' : 'Find Hotels'}
                  </button>
                )}
              </div>
            </div>
            
            {placesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map(hotel => (
                  <PlaceCard key={hotel.place_id} place={hotel} type="hotels" />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Restaurants in {trip.location}</h2>
              <div className="flex gap-2">
                {trip.savedRestaurants && trip.savedRestaurants.length > 0 && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {trip.savedRestaurants.length} saved
                  </span>
                )}
                {restaurants.length === 0 && (
                  <button
                    onClick={() => searchPlaces('restaurant')}
                    disabled={placesLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {placesLoading ? 'Loading...' : 'Find Restaurants'}
                  </button>
                )}
              </div>
            </div>
            
            {placesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map(restaurant => (
                  <PlaceCard key={restaurant.place_id} place={restaurant} type="restaurants" />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Activities in {trip.location}</h2>
              <div className="flex gap-2">
                {trip.savedActivities && trip.savedActivities.length > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    {trip.savedActivities.length} saved
                  </span>
                )}
                {activities.length === 0 && (
                  <button
                    onClick={() => searchPlaces('tourist_attraction')}
                    disabled={placesLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {placesLoading ? 'Loading...' : 'Find Activities'}
                  </button>
                )}
              </div>
            </div>
            
            {placesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md animate-pulse">
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map(activity => (
                  <PlaceCard key={activity.place_id} place={activity} type="activities" />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-8">
            <SavedPlaces
              places={trip.savedHotels || []}
              type="hotels"
              onRemove={(placeId) => removePlace(placeId, 'hotels')}
            />
            
            <SavedPlaces
              places={trip.savedRestaurants || []}
              type="restaurants"
              onRemove={(placeId) => removePlace(placeId, 'restaurants')}
            />
            
            <SavedPlaces
              places={trip.savedActivities || []}
              type="activities"
              onRemove={(placeId) => removePlace(placeId, 'activities')}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}