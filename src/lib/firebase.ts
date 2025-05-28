import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// !! CRITICAL: REPLACE THESE PLACEHOLDER VALUES WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION !!
// You can find this configuration in your Firebase project settings:
// Firebase Console > Project settings (gear icon) > General tab > Your apps > Web app > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE", // Replace with your actual API key
  authDomain: "YOUR_PROJECT_ID_HERE.firebaseapp.com", // Replace YOUR_PROJECT_ID_HERE with your actual project ID
  projectId: "YOUR_PROJECT_ID_HERE", // Replace with your actual project ID
  storageBucket: "YOUR_PROJECT_ID_HERE.appspot.com", // Replace YOUR_PROJECT_ID_HERE with your actual project ID
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE", // Replace with your actual Messaging Sender ID
  appId: "YOUR_APP_ID_HERE" // Replace with your actual App ID
  // measurementId: "YOUR_MEASUREMENT_ID_HERE" // Optional: Replace if you use Google Analytics
};

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // console.log("Firebase app initialized for the first time."); // Removed for cleaner console
} else {
  app = getApps()[0];
  // console.log("Firebase app already initialized."); // Removed for cleaner console
}

auth = getAuth(app);
// console.log("Firebase Auth initialized."); // Removed for cleaner console

export { auth };
export default app;
