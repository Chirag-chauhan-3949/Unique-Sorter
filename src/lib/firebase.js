import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app = null;
let db = null;
let auth = null;
let storage = null;
let isFirestoreAvailable = false;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log('Firebase initialized successfully');

    // Note: Firestore database needs to be created in Firebase Console
    // Go to https://console.firebase.google.com/ -> Firestore Database -> Create database
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('Firebase not configured. Running in backend-only mode.');
}

/**
 * Check if Firestore database is actually accessible
 * Call this before Firestore operations to avoid NOT_FOUND errors
 */
async function checkFirestoreAccess() {
  if (!db) return false;

  try {
    // Try a simple operation to verify Firestore exists
    const { getDocs, query, collection, limit } = await import('firebase/firestore');
    const testQuery = query(collection(db, '_test_'), limit(1));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    // NOT_FOUND error means Firestore database doesn't exist
    if (error.code === 'not-found' || error.message?.includes('NOT_FOUND')) {
      console.warn('Firestore database not found. Please create it in Firebase Console:');
      console.warn('https://console.firebase.google.com/ -> Firestore Database -> Create database');
    } else if (error.code === 'permission-denied') {
      console.warn('Firestore permission denied. Check your Firebase security rules.');
    } else {
      // Other errors might be transient
      console.warn('Firestore access check error:', error.message);
    }
    return false;
  }
}

export { db, auth, storage, isFirestoreAvailable, checkFirestoreAccess };
export default app;
export { isFirebaseConfigured };
