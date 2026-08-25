import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration – copied directly from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyALwikAxh-QcnNFLvUzJQOgbuuh93l_Gdc",
  authDomain: "chatup-4c19d.firebaseapp.com",
  projectId: "chatup-4c19d",
  storageBucket: "chatup-4c19d.firebasestorage.app",
  messagingSenderId: "254805464495",
  appId: "1:254805464495:web:c76a84cedb426a17550b5a"
};

// ✅ Only initialize in the browser – prevents Vercel build errors
const app = typeof window !== 'undefined' && !getApps().length
  ? initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
