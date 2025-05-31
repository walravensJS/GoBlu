import { useRef, useState, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { query, where, getDocs, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { MapPin, Calendar, Clock, Plus, Sparkles, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGoogleMaps } from '../components/providers/GoogleMapsProvider';

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

export default function LoggedHome() {
  const { isLoaded } = useGoogleMaps();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [location, setLocation] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [until, setUntil] = useState<string>('');
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [tripsLoading, setTripsLoading] = useState(true);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current && isLoaded) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.formatted_address) {
        setLocation(place.formatted_address);
      }
      
      if (place.photos && place.photos.length > 0) {
        const photoUrl = place.photos[0].getUrl({ maxWidth: 800 });
        setImageUrl(photoUrl);
      } else {
        setImageUrl('');
      }
    }
  };

  const handleCreateTrip = async (): Promise<void> => {
    if (!title || !description || !from || !until || !location) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'trips'), {
        title,
        description,
        location,
        from: new Date(from),
        until: new Date(until),
        userId: auth.currentUser?.uid,
        imageUrl,
      });
      alert('Trip created successfully!');
      // Clear form
      setTitle('');
      setDescription('');
      setFrom('');
      setUntil('');
      setLocation('');
      setImageUrl('');
      setIsFormVisible(false);
      // Refresh trips list
      fetchTrips();
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip.');
    }
  };

  const fetchTrips = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
      setTripsLoading(false);
      return;
    }

    try {
      setTripsLoading(true);
      const tripsQuery = query(
        collection(db, 'trips'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(tripsQuery);
      const trips: Trip[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Trip));
      setUserTrips(trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Show loading state while Google Maps or trips are loading
  if (!isLoaded || tripsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-6"></div>
          <p className="text-white text-xl">
            {!isLoaded ? 'Loading Google Maps...' : 'Loading your trips...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 min-h-screen">

      <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full text-sm font-medium mb-6 animate-bounce text-white">
              <Sparkles className="w-4 h-4" />
              Welcome back, Explorer!
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text mb-4">
              Your Journey
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create unforgettable memories and discover amazing destinations around the world
            </p>
          </div>

          {/* Trips Grid */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <MapPin className="w-8 h-8 text-purple-400" />
                Your Adventures
              </h2>
              <button
                onClick={() => setIsFormVisible(!isFormVisible)}
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Plan New Trip
              </button>
            </div>

            {userTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {userTrips.map((trip, index) => (
                  <div
                    key={trip.id}
                    className="group bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 border border-white/20 relative"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={trip.imageUrl}
                        alt="Trip destination"
                        className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* View Details Button - appears on hover */}
                      <Link
                        to={`/trips/${trip.id}`}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:bg-opacity-30 transition">
                          <Eye className="w-5 h-5" />
                          View Details
                        </div>
                      </Link>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-purple-300 transition-colors duration-300">
                        {trip.title}
                      </h3>
                      <p className="text-gray-300 mb-4 line-clamp-2">
                        {trip.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-purple-300 mb-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(trip.from.seconds * 1000).toLocaleDateString()} –{' '}
                        {new Date(trip.until.seconds * 1000).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <MapPin className="w-4 h-4" />
                        {trip.location}
                      </div>
                      
                      {/* Action Button at bottom */}
                      <Link
                        to={`/trips/${trip.id}`}
                        className="block w-full text-center bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        Explore Trip
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-purple-400" />
                </div>
                <p className="text-2xl text-gray-300 mb-4">No adventures yet</p>
                <p className="text-gray-400">Start planning your first amazing journey!</p>
              </div>
            )}
          </div>

          {/* Create Trip Form */}
          <div className={`transition-all duration-500 ${isFormVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Plan Your Next Adventure
              </h2>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trip Title</label>
                  <input
                    type="text"
                    placeholder="My Amazing Adventure"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    placeholder="Describe your perfect trip..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      From
                    </label>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Until
                    </label>
                    <input
                      type="date"
                      value={until}
                      onChange={(e) => setUntil(e.target.value)}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Destination
                  </label>
                  <Autocomplete
                    onLoad={(auto) => (autocompleteRef.current = auto)}
                    onPlaceChanged={handlePlaceChanged}
                    options={{ types: ['(cities)'] }}
                  >
                    <input
                      type="text"
                      placeholder="Search for a city..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                      disabled={!isLoaded}
                    />
                  </Autocomplete>
                </div>

                {imageUrl && (
                  <div className="relative group">
                    <img
                      src={imageUrl}
                      alt="Destination preview"
                      className="w-full h-64 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                )}

                <button
                  onClick={handleCreateTrip}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your Adventure
                </button>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
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