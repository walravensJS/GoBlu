import {useState, useEffect} from 'react';
import {getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged} from 'firebase/auth'
import { useNavigate } from 'react-router-dom';
import { createUserIfNotExists } from '../utils/firestoreHelpers';


const Login = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  
  // State variables for managing authentication state, email, password, and error messages
  const [authing, setAuthing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard
        navigate('/dashboard');
      } else {
        // No user is signed in, allow login
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth, navigate]);

  const signInWithGoogle = async () => {
    setAuthing(true);
    
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await createUserIfNotExists(result.user);
      navigate('/dashboard');
    } catch (error) {
      console.log(error);
      setAuthing(false);
    }
  };
  

  const signInWithEmail = async () => {
  setAuthing(true);
  setError('');

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createUserIfNotExists(result.user);
    navigate('/dashboard');
  } catch (error: any) {
    console.log(error);
    setError(error.message);
    setAuthing(false);
  }
};


  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#1a1a1a]">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className='w-full h-screen flex'>
        {/* Left half of the screen - background styling */}
        <div className='w-1/2 h-full flex flex-col bg-[#282c34] items-center justify-center'>
        </div>

        {/* Right half of the screen - login form */}
        <div className='w-1/2 h-full bg-[#1a1a1a] flex flex-col p-20 justify-center'>
            <div className='w-full flex flex-col max-w-[450px] mx-auto'>
                {/* Header section with title and welcome message */}
                <div className='w-full flex flex-col mb-10 text-white'>
                    <h3 className='text-4xl font-bold mb-2'>Login</h3>
                    <p className='text-lg mb-4'>Welcome Back! Please enter your details.</p>
                </div>

                {/* Input fields for email and password */}
                <div className='w-full flex flex-col mb-6'>
                    <input
                        type='email'
                        placeholder='Email'
                        className='w-full text-white py-2 mb-4 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} />
                    <input
                        type='password'
                        placeholder='Password'
                        className='w-full text-white py-2 mb-4 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} />
                </div>

                {/* Button to log in with email and password */}
                <div className='w-full flex flex-col mb-4'>
                    <button
                        className='w-full bg-transparent border border-white text-white my-2 font-semibold rounded-md p-4 text-center flex items-center justify-center cursor-pointer'
                        onClick={signInWithEmail}
                        disabled={authing}>
                        Log In With Email and Password
                    </button>
                </div>

                {/* Display error message if there is one */}
                {error && <div className='text-red-500 mb-4'>{error}</div>}

                {/* Divider with 'OR' text */}
                <div className='w-full flex items-center justify-center relative py-4'>
                    <div className='w-full h-[1px] bg-gray-500'></div>
                    <p className='text-lg absolute text-gray-500 bg-[#1a1a1a] px-2'>OR</p>
                </div>

                {/* Button to log in with Google */}
                <button
                    className='w-full bg-white text-black font-semibold rounded-md p-4 text-center flex items-center justify-center cursor-pointer mt-7'
                    onClick={signInWithGoogle}
                    disabled={authing}>
                    Log In With Google
                </button>
            </div>

            {/* Link to sign up page */}
            <div className='w-full flex items-center justify-center mt-10'>
                <p className='text-sm font-normal text-gray-400'>Don't have an account? <span className='font-semibold text-white cursor-pointer underline'><a href='/signup'>Sign Up</a></span></p>
            </div>
        </div>
    </div>
  );
}

export default Login;