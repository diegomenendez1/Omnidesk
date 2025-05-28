
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"; // Only if you need analytics

// CRITICAL: REPLACE ALL 'YOUR_..._HERE' VALUES WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION
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
  } catch (error) {
    console.error("CRITICAL: Error initializing Firebase app. Ensure firebaseConfig in src/lib/firebase.ts is correct.", error);
    // @ts-ignore
    app = undefined; 
  }
} else {
  app = getApps()[0];
}

// Initialize Auth only if app was initialized successfully
if (app!) { 
  try {
    auth = getAuth(app);
  } catch (error) {
    console.error("CRITICAL: Error initializing Firebase Auth. Ensure firebaseConfig in src/lib/firebase.ts is correct and Auth is enabled in your Firebase project.", error);
    // @ts-ignore
    auth = undefined; 
  }
  
  // Example for Analytics, uncomment if needed
  // if (typeof window !== 'undefined') { 
  //   isSupported().then(supported => {
  //     if (supported) {
  //       try {
  //         analytics = getAnalytics(app);
  //       } catch (error) {
  //         console.error("Error initializing Firebase Analytics:", error);
  //       }
  //     }
  //   });
  // }
} else {
  console.error("CRITICAL: Firebase app is not initialized. Auth (and other services) will not be available. PLEASE CHECK YOUR firebaseConfig in src/lib/firebase.ts.");
  // @ts-ignore
  auth = undefined; 
}

export { auth }; 
export default app; 
