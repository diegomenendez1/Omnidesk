
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Import getAuth

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxy16sIrioO8RGHj2h48A8fIKraxQrAIE",
  authDomain: "allnews-9dc1b.firebaseapp.com",
  databaseURL: "https://allnews-9dc1b.firebaseio.com",
  projectId: "allnews-9dc1b",
  storageBucket: "allnews-9dc1b.firebasestorage.app",
  messagingSenderId: "636092770413",
  appId: "1:636092770413:web:e8472bcc7e82d78b307764",
  measurementId: "G-4EFNK5F5SL"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

const auth = getAuth(app); // Initialize Firebase Auth and get a reference to the service

let analytics;
// Check if Analytics is supported in the current environment before initializing
if (typeof window !== 'undefined') { // Analytics is client-side
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(err => {
    console.error("Failed to initialize Firebase Analytics", err);
  });
}

export { app, auth, analytics }; // Export auth
