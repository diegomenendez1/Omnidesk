import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC_fDFUGtCTEDFfAaroaGShZrK84cqjyTA",
  authDomain: "omnidesk-3v8d2.firebaseapp.com",
  projectId: "omnidesk-3v8d2",
  storageBucket: "omnidesk-3v8d2.appspot.com",
  messagingSenderId: "916212398039",
  appId: "1:916212398039:web:a6a34640cc5dc3282aa052"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
