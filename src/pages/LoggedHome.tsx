import { useRef, useState, useEffect } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { query, where, getDocs, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase'; // Adjust the import path if needed

const libraries = ['places'];

export default function LoggedHome() {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState('');



  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
  
      if (place.formatted_address) {
        setLocation(place.formatted_address);
      }
  
      if (place.photos && place.photos.length > 0) {
        const photoUrl = place.photos[0].getUrl({ maxWidth: 800 }); // Adjust width if needed
        setImageUrl(photoUrl);
      } else {
        setImageUrl(''); // Clear image if none found
      }
    }
  };
  

  const handleCreateTrip = async () => {
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
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip.');
    }
  };

  useEffect(() => {
    const fetchTrips = async () => {
      const user = auth.currentUser;
      if (!user) return;
  
      try {
        const tripsQuery = query(
          collection(db, 'trips'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(tripsQuery);
        const trips = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserTrips(trips);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };
  
    fetchTrips();
  }, []);
  

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_API_KEY}
      libraries={libraries}
    >

<div className="mt-8">
  <h2 className="text-lg font-semibold mb-2">Your trips</h2>
  {userTrips.length > 0 ? (
    <ul className="space-y-2">
      {userTrips.map((trip) => (
        <li key={trip.id} className="border p-2 rounded">
            <img src={trip.imageUrl} alt="Location preview" className="w-full h-48 object-cover rounded" referrerPolicy="no-referrer"
  />
          <h3 className="font-bold">{trip.title}</h3>
          <p>{trip.description}</p>
          <p className="text-sm text-gray-500">
            {new Date(trip.from.seconds * 1000).toLocaleDateString()} –{' '}
            {new Date(trip.until.seconds * 1000).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">{trip.location}</p>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-gray-500">You have no trips. Plan one now :D</p>
  )}
</div>


      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold mb-4">You're currently logged in.</h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <Autocomplete
            onLoad={(auto) => (autocompleteRef.current = auto)}
            onPlaceChanged={handlePlaceChanged}
            options={{ types: ['(cities)'] }}
          >
            <input
              type="text"
              placeholder="Search for a city…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </Autocomplete>
          {imageUrl && (
  <img
    src={imageUrl}
    alt="Location preview"
    className="w-full h-48 object-cover rounded"
    referrerPolicy="no-referrer"
  />
)}



          <button
            onClick={handleCreateTrip}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Create Trip
          </button>
        </div>
      </div>
    </LoadScript>
  );
}
