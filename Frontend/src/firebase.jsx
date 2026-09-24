import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjii2xH_RhKJY__ilnHEzApDQc-4r7f-k",
  authDomain: "geminiclone1-74e44.firebaseapp.com",
  projectId: "geminiclone1-74e44",
  storageBucket: "geminiclone1-74e44.firebasestorage.app",
  messagingSenderId: "1022016141307",
  appId: "1:1022016141307:web:4bf7cb0069447915e77d5e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);