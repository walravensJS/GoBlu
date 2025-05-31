import { initializeApp, getApps, getApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDpR4LJJ2N1XJz8mRhYDS6bjZK15jUvKS0",
  authDomain: "travel-app-ee3c4.firebaseapp.com",
  projectId: "travel-app-ee3c4",
  storageBucket: "travel-app-ee3c4.firebasestorage.app",
  messagingSenderId: "714267992207",
  appId: "1:714267992207:web:e301e1c7cab1a6c6e590fa",
  measurementId: "G-PB9ZXG7W4T"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

const db = getFirestore(app);

export const COLLECTIONS = {
  USERS: "users",
  FRIENDS: "friends",
  FRIEND_REQUESTS: "friendRequests", // Changed from "q5A98VdUnENvun7pe1Mn"
  TRIPS: "trips"
};

export { app, db };