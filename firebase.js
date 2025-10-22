import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables from vite.config.ts
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let db = null;

// Only initialize if the essential config values are present.
// This prevents errors if the environment variables are not set.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed. Please check your environment variables.", error);
    db = null; // Ensure db is null on failure
  }
} else {
  // This warning is helpful for developers setting up the project.
  console.warn("Firebase configuration is incomplete. Logging to Firestore is disabled.");
}

export { db };
