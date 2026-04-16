import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDHrnmjl7MJC0dz-SDHXDAgFoD2Dl8p60k",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mazirapp.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mazirapp",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mazirapp.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1018433182095",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1018433182095:web:6aa27626b3ec44bf1953fa",
};

// Initialize Firebase
if (typeof window !== 'undefined') {
    console.log('[Firebase] Initializing with config for project:', firebaseConfig.projectId);
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const getFcmToken = async (registration?: ServiceWorkerRegistration) => {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        return token;
      }
    }
    return null;
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export { app };
