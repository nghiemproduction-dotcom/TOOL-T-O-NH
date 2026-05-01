import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Use environment variables if available, otherwise fallback to local config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || firebaseConfigLocal.appId,
  firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigLocal.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);
