
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// ATENCIÓN: Estos valores DEBEN ser los de tu proyecto Firebase real.
const firebaseConfig = {
  apiKey: "AIzaSyCf_DFUGCItEDfAaroaG5hZRk84cqjyhTA",
  authDomain: "omnidesk-3v8d2.firebaseapp.com",
  projectId: "omnidesk-3v8d2",
  storageBucket: "omnidesk-3v8d2.appspot.com", // Corregido según solicitud previa para terminar en .appspot.com
  messagingSenderId: "916221398039",
  appId: "1:916221398039:web:a6a43640cc5dc3282aa052"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export default app;
export { auth, db };
