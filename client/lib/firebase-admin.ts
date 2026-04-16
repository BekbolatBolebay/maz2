import * as admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

console.log('[Firebase Admin] Configuration check:');
console.log(' - Project ID:', firebaseAdminConfig.projectId ? 'OK' : 'MISSING');
console.log(' - Client Email:', firebaseAdminConfig.clientEmail ? 'OK' : 'MISSING');
console.log(' - Private Key:', firebaseAdminConfig.privateKey ? 'OK' : 'MISSING');

if (!admin.apps.length) {
  try {
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        throw new Error('Missing core Firebase Admin credentials in environment variables');
    }
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
    });
    console.log('[Firebase Admin] Initialized successfully');
  } catch (error: any) {
    console.error('[Firebase Admin] Initialization error:', error.message);
  }
}

export const messaging = admin.messaging();
export default admin;
