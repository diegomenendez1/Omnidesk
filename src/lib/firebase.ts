
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
// IMPORTANT: YOU MUST REPLACE THESE PLACEHOLDER VALUES WITH YOUR ACTUAL
// FIREBASE PROJECT CONFIGURATION FROM THE FIREBASE CONSOLE.
// GO TO: Firebase Console -> Project Settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Replace with your actual API Key
  authDomain: "omnidesk-3v8d2.firebaseapp.com", // Replace if different, but usually based on projectId
  projectId: "omnidesk-3v8d2", // Ensure this is your correct Firebase Project ID
  storageBucket: "omnidesk-3v8d2.storage.app", // Replace if different, usually based on projectId
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE", // Replace
  appId: "YOUR_APP_ID_HERE" // Replace
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized for the first time.");
} else {
  app = getApp(); // if already initialized, use that one
  console.log("Firebase app already initialized, using existing instance.");
}

let auth: Auth;
try {
  auth = getAuth(app);
  console.log("Firebase Auth initialized.");
} catch (error) {
  console.error("Error initializing Firebase Auth:", error);
  // @ts-ignore
  auth = null; // Set auth to null if initialization fails to prevent further errors
}

export { app, auth };
