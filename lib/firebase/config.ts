// Firebase Client SDK Configuration with dual-mode fallback
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'philfida-lcms.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'philfida-lcms',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'philfida-lcms.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '268137887244',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:268137887244:web:b190176341493b0312a029',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-KJW505C1ED',
};

export const hasFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  // Always initialize auth — needed for Google + Email sign-in
  auth = getAuth(app);
  if (hasFirebaseConfigured) {
    db = getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase init warning:', error);
}

// Configured Google provider for PhilFIDA domain sign-in
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: '' }); // allow any Google account

export { app, auth, db };
