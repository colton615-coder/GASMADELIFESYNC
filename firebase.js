import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// This config is duplicated from firebase.ts to ensure this module can stand alone
// and robustly provide the same singleton instance.
const firebaseConfig = {
  apiKey: "AIzaSyC8Hk-CbMVdV1eU2ixaFf2v4uZWWH3iIzz8",
  authDomain: "sf2025-be6b2.firebaseapp.com",
  projectId: "sf2025-be6b2",
  storageBucket: "sf2025-be6b2.appspot.com",
  messagingSenderId: "215593793023",
  appId: "1:215593793023:web:8b4d814f121302cd1263ca"
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
