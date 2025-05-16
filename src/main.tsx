import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {initializeApp} from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyDpR4LJJ2N1XJz8mRhYDS6bjZK15jUvKS0",
  authDomain: "travel-app-ee3c4.firebaseapp.com",
  projectId: "travel-app-ee3c4",
  storageBucket: "travel-app-ee3c4.appspot.com",
  messagingSenderId: "714267992207",
  appId: "1:714267992207:web:e301e1c7cab1a6c6e590fa",
  measurementId: "G-PB9ZXG7W4T"
};
initializeApp(firebaseConfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
