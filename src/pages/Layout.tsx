import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate, Outlet } from 'react-router-dom';

import { Navbar } from '../components/functional/main/Navbar';// Navigation component for authenticated user
import { Footer } from '../components/functional/main/Footer';// Navigation component for authenticated user

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
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render the layout with navigation, outlet for page content, and footer
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;