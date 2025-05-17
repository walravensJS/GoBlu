import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate, Outlet } from 'react-router-dom';

const AuthRoute: React.FC = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false);
      } else {
        console.log('unauthorized');
        setLoading(false);
        navigate('/signin');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  if (loading) return null;

  return <Outlet />;
};

export default AuthRoute;
