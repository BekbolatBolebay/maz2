/**
 * Service Worker for client app - handles push notifications
 */

// 1. Import Firebase scripts (Compatible versions)
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.1/firebase-messaging-compat.js');

// 2. Initialize Firebase in the worker
const firebaseConfig = {
    apiKey: "AIzaSyDHrnmjl7MJC0dz-SDHXDAgFoD2Dl8p60k",
    authDomain: "mazirapp.firebaseapp.com",
    projectId: "mazirapp",
    storageBucket: "mazirapp.firebasestorage.app",
    messagingSenderId: "1018433182095",
    appId: "1:1018433182095:web:6aa27626b3ec44bf1953fa"
};

if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// 3. Handle background messages (FCM specific)
messaging.onBackgroundMessage((payload) => {
    console.log('[Worker] Received background message (FCM):', payload);
    
    const title = payload.notification?.title || payload.data?.title || 'Mazir App';
    const body = payload.notification?.body || payload.data?.body || 'Жаңа хабарлама';
    
    const notificationOptions = {
        body: body,
        icon: payload.data?.icon || payload.notification?.icon || '/icon-192x192.png',
        badge: '/icon-light-32x32.png',
        tag: payload.data?.tag || payload.notification?.tag || 'order-update',
        data: {
            url: payload.data?.url || '/',
            orderId: payload.data?.orderId
        }
    };

    return self.registration.showNotification(title, notificationOptions);
});

// 4. Listen for push notifications (Standard Web-Push fallback)
self.addEventListener('push', function (event) {
    try {
        let data = {}

        if (event.data) {
            try {
                data = event.data.json()
            } catch (e) {
                console.error('[Worker] Failed to parse push data as JSON:', e)
                data = { body: event.data.text() }
            }
        }

        console.log('[Worker] Push notification received payload:', data)
        
        // If it's an FCM payload that the system didn't catch, or standard Web-Push
        const title = data.notification?.title || data.title || 'Mazir App'
        const body = data.notification?.body || data.body || 'Жаңа хабарлама'

        // Build notification options
        const options = {
            body: body,
            icon: data.icon || data.notification?.icon || '/icon-192x192.png',
            badge: '/icon-light-32x32.png',
            vibrate: [100, 50, 100],
            tag: data.tag || data.notification?.tag || `order-${Date.now()}`,
            requireInteraction: true,
            data: {
                dateOfArrival: Date.now(),
                url: data.url || data.data?.url || '/',
                orderId: data.orderId || data.data?.orderId,
            },
            actions: [
                { action: 'open', title: 'Посмотреть' },
                { action: 'close', title: 'Закрыть' }
            ]
        }

        event.waitUntil(
            self.registration.showNotification(title, options)
        )
    } catch (error) {
        console.error('[Worker] Error handling push event:', error)
    }
})

// 5. Handle notification clicks
self.addEventListener('notificationclick', function (event) {
    event.notification.close()

    if (event.action === 'close') return

    const url = event.notification.data?.url || '/'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i]
                    if (client.url && 'focus' in client) {
                        return client.focus()
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url)
                }
            })
    )
})

