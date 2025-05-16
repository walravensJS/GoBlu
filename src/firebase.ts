// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpR4LJJ2N1XJz8mRhYDS6bjZK15jUvKS0",
  authDomain: "travel-app-ee3c4.firebaseapp.com",
  projectId: "travel-app-ee3c4",
  storageBucket: "travel-app-ee3c4.appspot.com",
  messagingSenderId: "714267992207",
  appId: "1:714267992207:web:e301e1c7cab1a6c6e590fa",
  measurementId: "G-PB9ZXG7W4T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize and export auth and storage
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export the app as default
export default app;