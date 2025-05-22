import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

const Signup = () => {
    // Initialize Firebase authentication, Firestore, and navigation
    const auth = getAuth();
    const db = getFirestore();
    const navigate = useNavigate();
    
    // Available colors for user profiles with hex codes and names
    const availableColors = [
        { hex: '#6E44FF', name: 'Majorelle Blue' },
        { hex: '#B892FF', name: 'Tropical Indigo' },
        { hex: '#FFC2E2', name: 'Lavender Pink' },
        { hex: '#FF90B3', name: 'Baker-Miller Pink' },
        { hex: '#EF7A85', name: 'Light Coral' }
    ];
    
    // State variables for managing authentication state, email, password, confirm password, and error messages
    const [authing, setAuthing] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    // Function to generate a random color from available colors
    const getRandomColor = () => {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        return availableColors[randomIndex];
    };
    const saveUserData = async (userId, email, colorData, name) => {
        try {
            await setDoc(doc(db, "users", userId), {
                email: email,
                name: name,
                colorHex: colorData.hex,
                colorName: colorData.name,
                createdAt: new Date(),
            });
            console.log("User data saved successfully");
        } catch (error) {
            console.error("Error saving user data: ", error);
        }
    };
    

    // Function to handle sign-up with Google
    const signUpWithGoogle = async () => {
        setAuthing(true);
        
        // Use Firebase to sign up with Google
        signInWithPopup(auth, new GoogleAuthProvider())
            .then(async (response) => {
                const userId = response.user.uid;
                const userEmail = response.user.email;
                const randomColor = getRandomColor();
                
                // Save user data with random color
                await saveUserData(userId, userEmail, randomColor, response.user.displayName || '');
                
                console.log(userId);
                navigate('/');
            })
            .catch(error => {
                console.log(error);
                setAuthing(false);
            });
    };

    // Update signUpWithEmail function:
const signUpWithEmail = async (email: string, password: string) => {
    setError('');
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setAuthing(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const randomColor = getRandomColor();
      await saveUserData(userCredential.user.uid, email, randomColor, name);
      navigate('/');
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please sign in or use a different email.");
      } else {
        setError("Sign-up failed: " + error.message);
      }
    } finally {
      setAuthing(false);
    }
  };
  

    return (
        <div className='w-full h-screen flex'>
            {/* Left half of the screen - background styling */}
            <div className='w-1/2 h-full flex flex-col bg-[#282c34] items-center justify-center'>
            </div>

            {/* Right half of the screen - signup form */}
            <div className='w-1/2 h-full bg-[#1a1a1a] flex flex-col p-20 justify-center'>
                <div className='w-full flex flex-col max-w-[450px] mx-auto'>
                    {/* Header section with title and welcome message */}
                    <div className='w-full flex flex-col mb-10 text-white'>
                        <h3 className='text-4xl font-bold mb-2'>Sign Up</h3>
                        <p className='text-lg mb-4'>Welcome! Please enter your information below to begin.</p>
                    </div>

                    {/* Input fields for email, password, and confirm password */}
                    <div className='w-full flex flex-col mb-6'>
                    <input
    type='text'
    placeholder='Full Name'
    className='w-full text-white py-2 mb-4 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white'
    value={name}
    onChange={(e) => setName(e.target.value)}
/>

                        <input
                            type='email'
                            placeholder='Email'
                            className='w-full text-white py-2 mb-4 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type='password'
                            placeholder='Password'
                            className='w-full text-white py-2 mb-4 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <input
                            type='password'
                            placeholder='Re-Enter Password'
                            className='w-full text-white py-2 mb-4 bg-transparent border-b border-gray-500 focus:outline-none focus:border-white'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {/* Display error message if there is one */}
                    {error && <div className='text-red-500 mb-4'>{error}</div>}

                    {/* Button to sign up with email and password */}
                    <div className='w-full flex flex-col mb-4'>
                        <button
  onClick={() => signUpWithEmail(email, password)}
  disabled={authing}
                            className='w-full bg-transparent border border-white text-white my-2 font-semibold rounded-md p-4 text-center flex items-center justify-center cursor-pointer'>
                            Sign Up With Email and Password
                        </button>
                    </div>

                    {/* Divider with 'OR' text */}
                    <div className='w-full flex items-center justify-center relative py-4'>
                        <div className='w-full h-[1px] bg-gray-500'></div>
                        <p className='text-lg absolute text-gray-500 bg-[#1a1a1a] px-2'>OR</p>
                    </div>

                    {/* Button to sign up with Google */}
                    <button
                        onClick={signUpWithGoogle}
                        disabled={authing}
                        className='w-full bg-white text-black font-semibold rounded-md p-4 text-center flex items-center justify-center cursor-pointer mt-7'>
                        Sign Up With Google
                    </button>

                    {/* Information about color assignment */}
                    <div className='text-gray-400 text-sm mt-6 text-center'>
                        Your profile will be assigned one of our theme colors:
                        <div className='flex justify-center mt-2 space-x-2'>
                            {availableColors.map((color, index) => (
                                <div 
                                    key={index}
                                    className='w-6 h-6 rounded-full' 
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                ></div>
                            ))}
                        </div>
                        <div className='mt-2'>You can change it later in your profile settings.</div>
                    </div>
                </div>

                {/* Link to login page */}
                <div className='w-full flex items-center justify-center mt-10'>
                    <p className='text-sm font-normal text-gray-400'>Already have an account? <span className='font-semibold text-white cursor-pointer underline'><a href='/login'>Log In</a></span></p>
                </div>
            </div>
        </div>
    );
}

export default Signup;