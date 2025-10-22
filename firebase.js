import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration is now sourced from environment variables,
// which are exposed by the Vite build process.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let db = null;

// Only attempt to initialize Firebase if essential configuration is present.
// This prevents crashes and errors when environment variables are not set.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed. This could be a network issue or invalid credentials.", error);
    // db remains null
  }
} else {
  // This is not an error, but expected behavior if .env is not set up.
  // The app will function without Firestore features.
  console.warn("Firebase configuration is missing or incomplete. Firestore-based logging is disabled.");
}

export { db };
