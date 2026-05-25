import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app = null;
let adminDb = null;
let adminAuth = null;

try {
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('Firebase Admin credentials not configured');
  }
  app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.split(String.fromCharCode(92) + 'n').join('\n'),
        }),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      });
  adminDb = getFirestore(app);
  adminAuth = getAuth(app);
} catch (e) {
  console.warn('Firebase Admin not initialized:', e.message);
}

/**
 * Create a Firebase Auth user and set custom claims
 * @param {string} phone - User's phone number
 * @param {string} role - User's role ('admin' or 'user')
 * @returns {Promise<string>} - Firebase Auth UID
 */
async function createFirebaseAuthUser(phone, role) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    // Create user in Firebase Auth with phone
    const userRecord = await adminAuth.createUser({
      phoneNumber: `+91${phone}`, // Assuming Indian phone numbers
      disabled: false,
    });

    // Set custom claims (role)
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: role,
    });

    console.log('Firebase Auth user created:', userRecord.uid);
    return userRecord.uid;
  } catch (error) {
    console.error('Error creating Firebase Auth user:', error);
    throw error;
  }
}

/**
 * Update custom claims for an existing user
 * @param {string} uid - Firebase Auth UID
 * @param {string} role - User's role ('admin' or 'user')
 */
async function updateUserRole(uid, role) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    await adminAuth.setCustomUserClaims(uid, {
      role: role,
    });
    console.log('Custom claims updated for user:', uid);
  } catch (error) {
    console.error('Error updating custom claims:', error);
    throw error;
  }
}

/**
 * Get user by phone number
 * @param {string} phone - Phone number
 * @returns {Promise<Object|null>} - User record or null
 */
async function getUserByPhone(phone) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    const userRecord = await adminAuth.getUserByPhoneNumber(`+91${phone}`);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a Firebase Auth user
 * @param {string} uid - Firebase Auth UID
 */
async function deleteFirebaseAuthUser(uid) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    await adminAuth.deleteUser(uid);
    console.log('Firebase Auth user deleted:', uid);
  } catch (error) {
    console.error('Error deleting Firebase Auth user:', error);
    throw error;
  }
}

/**
 * Generate a custom token for sign-in
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<string>} - Custom token
 */
async function generateCustomToken(uid) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    const customToken = await adminAuth.createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error('Error generating custom token:', error);
    throw error;
  }
}

/**
 * Verify an ID token
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<Object>} - Decoded token
 */
async function verifyIdToken(idToken) {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

export {
  adminDb,
  adminAuth,
  createFirebaseAuthUser,
  updateUserRole,
  getUserByPhone,
  deleteFirebaseAuthUser,
  generateCustomToken,
  verifyIdToken,
};
