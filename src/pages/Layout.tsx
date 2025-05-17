import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';

// Navigation component for authenticated users
const Navbar = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        navigate('/login');
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  };

  return (
    <nav className="bg-[#496BDB] text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">GoBlu</div>
        <div className="flex space-x-6">
          <a href="/dashboard" className="hover:text-gray-300">Dashboard</a>
          <a href="/profile" className="hover:text-gray-300">Profile</a>
          <button 
            onClick={handleLogout}
            className="hover:text-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

// Footer component
const Footer = () => {
  return (
    <footer className="text-gray-200 p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} GoBlu. All rights reserved.</p>
      </div>
    </footer>
  );
};

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