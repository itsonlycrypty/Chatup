import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Hardcoded config – replace with YOUR actual values
const firebaseConfig = {
  apiKey: "AIzaSyALwikAxh-QcnNFLvUzJQOgbuhu931_Gdc",
  authDomain: "chatup-4c19d.firebaseapp.com",
  projectId: "chatup-4c19d",
  storageBucket: "chatup-4c19d.firebasestorage.googleapis.com",
  messagingSenderId: "254805464495",
  appId: "1:254805464495:web:c76a84cedb426a17550b5a"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
