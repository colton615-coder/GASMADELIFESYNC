// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8Hk-CbMVdV1eU2ixaFf2v4uZWWH3iIzz8",
  authDomain: "sf2025-be6b2.firebaseapp.com",
  projectId: "sf2025-be6b2",
  storageBucket: "sf2025-be6b2.appspot.com",
  messagingSenderId: "215593793023",
  appId: "1:215593793023:web:8b4d814f121302cd1263ca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firestore - ensure this happens AFTER initializeApp
const db = getFirestore(app);

export { db };
