import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// NOTE: These are your personal Firebase project keys.
// It is generally recommended to use environment variables for security,
// but these have been hardcoded as per your request.
const firebaseConfig = {
  apiKey: "AIzaSyC8Hk-CbMVdV1eU2ixaFf2v4uZWWH3iIzz8",
  authDomain: "sf2025-be6b2.firebaseapp.com",
  projectId: "sf2025-be6b2",
  storageBucket: "sf2025-be6b2.appspot.com",
  messagingSenderId: "215593793023",
  appId: "1:215593793023:web:8b4d814f121302cd1263ca"
};

let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed. Please check your configuration.", error);
  // db will remain null, and dependent services can handle it gracefully.
}

export { db };