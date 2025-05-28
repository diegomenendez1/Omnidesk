
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// ATENCIÓN: ¡¡¡DEBES REEMPLAZAR ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE REAL!!!
// Si estos valores no son correctos, NINGÚN servicio de Firebase funcionará.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // <-- ¡REEMPLAZA ESTO!
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
  console.log("Firebase app initialized.");
} else {
  app = getApp();
  console.log("Firebase app already initialized.");
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export default app;
export { auth, db };
