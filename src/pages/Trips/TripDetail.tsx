import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { MapPin, Calendar, Clock, ArrowLeft, Edit, Trash2, Star, Phone, Globe, DollarSign } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'hotels' | 'restaurants' | 'activities'>('overview');
  const [placesLoading, setPlacesLoading] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!tripId) return;
      
      try {
        const tripDoc = await getDoc(doc(db, 'trips', tripId));
        if (tripDoc.exists()) {
          const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip;
          
          // Check if current user owns this trip
          if (tripData.userId !== auth.currentUser?.uid) {
            navigate('/dashboard');
            return;
          }
          
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
      await deleteDoc(doc(db, 'trips', trip.id));
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip.');
    }
  };

  const getPhotoUrl = (photoRef: string) => {
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

  const PlaceCard = ({ place }: { place: PlaceData }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {place.photos && place.photos[0] && (
        <img
          src={getPhotoUrl(place.photos[0].photo_reference)}
          alt={place.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{place.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{place.formatted_address}</p>
        
        <div className="flex items-center justify-between mb-3">
          {renderStars(place.rating)}
          {renderPriceLevel(place.price_level)}
        </div>

        <div className="space-y-2">
          {place.formatted_phone_number && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <a href={`tel:${place.formatted_phone_number}`} className="hover:text-blue-600">
                {place.formatted_phone_number}
              </a>
            </div>
          )}
          
          {place.website && (
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="w-4 h-4 mr-2" />
              <a 
                href={place.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-blue-600 truncate"
              >
                Visit Website
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
      </div>
    </div>
  );

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
              { key: 'activities', label: 'Activities' }
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
            <div className="bg-white rounded-lg shadow-md p-8">
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
          </div>
        )}

        {activeTab === 'hotels' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Hotels in {trip.location}</h2>
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
                  <PlaceCard key={hotel.place_id} place={hotel} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Restaurants in {trip.location}</h2>
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
                  <PlaceCard key={restaurant.place_id} place={restaurant} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Activities in {trip.location}</h2>
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
                  <PlaceCard key={activity.place_id} place={activity} />
                ))}
              </div>
            )}
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