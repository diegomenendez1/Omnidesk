// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore"; // Added Firestore import

// Your web app's Firebase configuration
// ATENCIÓN: Reemplaza estos valores con los de tu proyecto Firebase real.
// Especialmente la apiKey. Si la apiKey no es válida, el login fallará.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // <-- ¡¡¡VERIFICA Y REEMPLAZA ESTA CLAVE CON LA DE TU PROYECTO!!!
  authDomain: "YOUR_AUTH_DOMAIN_HERE", // e.g., omnidesk-3v8d2.firebaseapp.com
  projectId: "YOUR_PROJECT_ID_HERE", // e.g., omnidesk-3v8d2
  storageBucket: "YOUR_STORAGE_BUCKET_HERE", // e.g., omnidesk-3v8d2.appspot.com
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app); // Initialize Firestore

export default app;
export { auth, db }; // Export db
