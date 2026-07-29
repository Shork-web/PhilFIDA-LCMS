// Firebase Admin SDK Configuration for Server Side / API Route Handlers
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

const rawKey = process.env.FIREBASE_PRIVATE_KEY;
const formattedKey = formatPrivateKey(rawKey);

export const hasFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  formattedKey &&
  !formattedKey.includes('YOUR_PRIVATE_KEY_HERE') &&
  formattedKey.includes('BEGIN PRIVATE KEY')
);

let adminAuth: ReturnType<typeof getAuth> | null = null;
let adminDb: ReturnType<typeof getFirestore> | null = null;

if (!getApps().length && hasFirebaseAdminConfigured && formattedKey) {
  try {
    const adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.warn('Firebase Admin Init notice:', error);
  }
}

export { adminAuth, adminDb };
