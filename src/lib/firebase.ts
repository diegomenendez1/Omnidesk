
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// Add other Firebase services like Firestore if needed
// import { getFirestore, type Firestore } from "firebase/firestore";

// IMPORTANT: REPLACE THESE WITH YOUR PROJECT'S ACTUAL FIREBASE CONFIGURATION
// You can find this in your Firebase project console:
// Project settings > General > Your apps > Web app > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "AIzaSyCxy16sIrioO8RGHj2h48A8fIKraxQrAIE", // <<< THIS IS LIKELY INVALID
  authDomain: "allnews-9dc1b.firebaseapp.com",
  databaseURL: "https://allnews-9dc1b.firebaseio.com", // Only if using Realtime Database
  projectId: "allnews-9dc1b",
  storageBucket: "allnews-9dc1b.appspot.com", // Only if using Storage
  messagingSenderId: "636092770413", // Only if using Messaging
  appId: "1:636092770413:web:e8472bcc7e82d78b307764",
  measurementId: "G-4EFNK5F5SL" // Only if using Analytics
};

let app: FirebaseApp;
let auth: Auth;
// let db: Firestore; // Example for Firestore

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// db = getFirestore(app); // Example for Firestore

export { app, auth };
// export { app, auth, db }; // If using Firestore
