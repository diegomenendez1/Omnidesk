
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Replace with your actual API key
  authDomain: "omnidesk-3v8d2.firebaseapp.com", // Replace with your actual authDomain
  projectId: "omnidesk-3v8d2", // Replace with your actual projectId
  storageBucket: "omnidesk-3v8d2.appspot.com", // Corrected to .appspot.com
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE", // Replace with your actual messagingSenderId
  appId: "YOUR_APP_ID_HERE", // Replace with your actual appId
  // measurementId: "YOUR_MEASUREMENT_ID_HERE" // Optional: Replace with your actual measurementId
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
// let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized for the first time.");
} else {
  app = getApps()[0];
  console.log("Firebase app already initialized.");
}

auth = getAuth(app);
console.log("Firebase Auth initialized.");

// Check for Analytics support and initialize if available (optional)
// isSupported().then(supported => {
//   if (supported) {
//     analytics = getAnalytics(app);
//     console.log("Firebase Analytics initialized.");
//   } else {
//     console.log("Firebase Analytics is not supported in this environment.");
//   }
// });

export { auth };
export default app;
// export { analytics };
