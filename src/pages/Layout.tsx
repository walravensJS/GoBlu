import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate, Outlet } from 'react-router-dom';

import { Navbar } from '../components/functional/main/Navbar';
import { Footer } from '../components/functional/main/Footer';
import { GoogleMapsProvider } from '../components/providers/GoogleMapsProvider';

// Protected layout component with authentication check
const Layout = () => {
  const auth = getAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [auth]);

  // Show loading state while checking authentication
  if (!authChecked) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render the layout with navigation, outlet for page content, and footer
  return (
    <GoogleMapsProvider>
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-grow container mx-auto py-8 px-4">
          <Outlet />
        </main>
        <Footer />
      </div>
    </GoogleMapsProvider>
  );
};

export default Layout;