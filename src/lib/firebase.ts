// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCf_DFUGCItEDfAaroaG5hZRk84cqjyhTA",
  authDomain: "omnidesk-3v8d2.firebaseapp.com",
  projectId: "omnidesk-3v8d2",
  storageBucket: "omnidesk-3v8d2.firebasestorage.app",
  messagingSenderId: "916221398039",
  appId: "1:916221398039:web:a6a43640cc5dc3282aa052"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

const auth = getAuth(app);

export { app, auth };
