// Firebase configuration and initialization
// This file sets up Firebase services: Authentication, Firestore (database), and Storage.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCc64W2H5lzzGZIJ9_UhvbZYOa1GeIa49M",
  authDomain: "ballora-50dfb.firebaseapp.com",
  projectId: "ballora-50dfb",
  storageBucket: "ballora-50dfb.appspot.com", 
  messagingSenderId: "116427701252",
  appId: "1:116427701252:web:762fd7acb70c16f948c951",
  measurementId: "G-79B4G4EG3C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 
export default app;