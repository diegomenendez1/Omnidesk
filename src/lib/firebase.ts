import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"; // Only if you need analytics

// IMPORTANT: REPLACE ALL 'YOUR_..._HERE' VALUES WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION
// You can find this in your Firebase project settings -> General -> Your apps -> Web app config.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_HERE", // CRITICAL: Replace this
  authDomain: "YOUR_AUTH_DOMAIN_HERE", // e.g., omnidesk-3v8d2.firebaseapp.com
  projectId: "YOUR_PROJECT_ID_HERE", // e.g., omnidesk-3v8d2
  storageBucket: "YOUR_STORAGE_BUCKET_HERE", // e.g., omnidesk-3v8d2.appspot.com
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE"
  // measurementId: "YOUR_MEASUREMENT_ID_HERE" // Optional: only if you use Google Analytics
};

let app: FirebaseApp;
let auth: Auth;
// let analytics: Analytics | undefined; // Only if you need analytics

// Initialize Firebase
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    // @ts-ignore
    app = undefined; // Ensure app is undefined if initialization fails
  }
} else {
  app = getApps()[0];
  console.log("Firebase app already initialized.");
}

// Initialize Auth only if app was initialized successfully
if (app!) { // The '!' asserts that app is not undefined here
  try {
    auth = getAuth(app);
    console.log("Firebase Auth initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    // @ts-ignore
    auth = undefined; // Ensure auth is undefined if initialization fails
  }
  
  // Example for Analytics, uncomment if needed
  // if (typeof window !== 'undefined') { // Analytics is client-side only
  //   isSupported().then(supported => {
  //     if (supported) {
  //       try {
  //         analytics = getAnalytics(app);
  //         console.log("Firebase Analytics initialized successfully.");
  //       } catch (error) {
  //         console.error("Error initializing Firebase Analytics:", error);
  //       }
  //     } else {
  //       console.log("Firebase Analytics is not supported in this environment.");
  //     }
  //   });
  // }
} else {
  console.error("Firebase app is not initialized. Auth (and other services) will not be available.");
  // @ts-ignore
  auth = undefined; // Explicitly set auth to undefined if app is not initialized
}

export { auth }; // Export auth
export default app; // Export app as default
