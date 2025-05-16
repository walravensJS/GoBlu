import { useState } from 'react';
import { Plane, Compass, User, LogIn, Map, LucidePlaneTakeoff } from 'lucide-react';

const Home = () => {
  const [activeTab, setActiveTab] = useState('explore');

  const destinations = [
    {
      name: 'Santorini, Greece',
      image: '/api/placeholder/800/500',
      description: 'Breathtaking views and pristine beaches'
    },
    {
      name: 'Kyoto, Japan',
      image: '/api/placeholder/800/500',
      description: 'Ancient temples and serene gardens'
    },
    {
      name: 'Machu Picchu, Peru',
      image: '/api/placeholder/800/500',
      description: 'Explore the iconic Incan citadel'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-blue-700">GoBlu</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab('explore')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'explore' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                Explore
              </button>
              <button 
                onClick={() => setActiveTab('destinations')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'destinations' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                Destinations
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'about' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                About Us
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-white text-blue-600 px-4 py-2 rounded-md border border-blue-600 hover:bg-blue-50 flex items-center">
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative">
        <div className="h-96 bg-cover bg-center" style={{backgroundImage: 'url("/api/placeholder/1600/900")'}}></div>
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Discover Your Next Adventure</h1>
            <p className="text-xl text-white mb-8">Explore breathtaking destinations around the world</p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-700 flex items-center">
                <Compass className="h-5 w-5 mr-2" />
                Start Exploring
              </button>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-md text-lg hover:bg-blue-50 flex items-center">
                <Map className="h-5 w-5 mr-2" />
                View Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Destinations */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800">Featured Destinations</h2>
          <p className="text-gray-600 mt-2">Handpicked places to inspire your next trip</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {destinations.map((dest, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="h-48 bg-cover bg-center" style={{backgroundImage: `url(${dest.image})`}}></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800">{dest.name}</h3>
                <p className="text-gray-600 mt-2">{dest.description}</p>
                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Embark on Your Journey?</h2>
          <p className="text-blue-100 text-lg mb-8">Create an account to save your favorite destinations and get personalized recommendations.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-50 w-full sm:w-auto">
              Sign In
            </button>
            <button className="bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-800 w-full sm:w-auto">
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">Why Choose GoBlu</h2>
          <p className="text-gray-600 mt-2">We make travel planning easy and enjoyable</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <Map className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Personalized Itineraries</h3>
            <p className="text-gray-600">Get custom travel plans tailored to your preferences and budget.</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <LucidePlaneTakeoff className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Hidden Gems</h3>
            <p className="text-gray-600">Discover off-the-beaten-path destinations recommended by locals.</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart Recommendations</h3>
            <p className="text-gray-600">Our AI helps you find places you'll love based on your travel history.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">GoBlu</span>
              </div>
              <p className="mt-2 text-gray-400">Your journey begins with us</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Support</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Safety</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Cancellation Options</a></li>
                </ul>
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <h3 className="text-lg font-semibold mb-4">Keep in Touch</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.093 4.093 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.615 11.615 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} GoBlu Travel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;