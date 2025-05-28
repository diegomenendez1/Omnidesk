// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: Ensure these are your actual Firebase project credentials!
const firebaseConfig = {
  apiKey: "AIzaSyCf_DFUGCItEDfAaroaG5hZRk84cqjyhTA",
  authDomain: "omnidesk-3v8d2.firebaseapp.com",
  projectId: "omnidesk-3v8d2",
  storageBucket: "omnidesk-3v8d2.appspot.com", // Corrected format
  messagingSenderId: "916221398039",
  appId: "1:916221398039:web:a6a43640cc5dc3282aa052"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { auth, db };
export default app;
