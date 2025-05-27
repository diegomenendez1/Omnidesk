import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
// import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCf_DFUGCItEDfAaroaG5hZRk84cqjyhTA",
  authDomain: "omnidesk-3v8d2.firebaseapp.com",
  projectId: "omnidesk-3v8d2",
  storageBucket: "omnidesk-3v8d2.appspot.com",
  messagingSenderId: "916221398039",
  appId: "1:916221398039:web:a6a43640cc5dc3282aa052"
};

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized for the first time.");
} else {
  app = getApps()[0];
  console.log("Firebase app already initialized.");
}

auth = getAuth(app);
console.log("Firebase Auth initialized.");

export { auth };
export default app;
