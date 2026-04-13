import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length && firebaseAdminConfig.projectId) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
    });
    console.log('[Firebase Admin] Initialized successfully');
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error);
  }
} else if (!admin.apps.length) {
  console.log('[Firebase Admin] Skipping initialization (missing credentials)');
}

// Export messaging only if initialized
export const messaging = admin.apps.length ? admin.messaging() : null;
export default admin;
