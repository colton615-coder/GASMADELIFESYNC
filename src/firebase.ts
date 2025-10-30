import { initializeApp, FirebaseApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// NOTE: These are your personal Firebase project keys.
// It is generally recommended to use environment variables for security,
// but these have been hardcoded as per your request.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

export { db };
