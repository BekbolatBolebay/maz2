/**
 * Service Worker for handling push notifications
 * Handles push events and notification clicks
 */

// 1. Import Firebase scripts (latest stable compat versions)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

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
console.log('[Worker] Firebase Messaging initialized');

// 3. Handle background messages (FCM specific)
messaging.onBackgroundMessage((payload) => {
    console.log('[Worker] 📥 Received background message (FCM):', payload);
    
    // Check if we already have a tag, otherwise create an order-based one
    const orderId = payload.data?.orderId || '';
    const tag = payload.data?.tag || (orderId ? `order-${orderId}` : `admin-notification-${Date.now()}`);
    
    const title = payload.notification?.title || payload.data?.title || '🔔 Mazir Admin';
    const body = payload.notification?.body || payload.data?.body || 'Жаңа тапсырыс түсті!';
    
    const notificationOptions = {
        body: body,
        icon: payload.data?.icon || payload.notification?.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
        tag: tag,
        timestamp: Date.now(),
        requireInteraction: true, // Make it stay until clicked
        renotify: true, // Vibrate even if the tag is the same
        data: {
            url: payload.data?.url || '/orders',
            orderId: orderId
        },
        actions: [
            { action: 'open', title: 'Тапсырысты көру' },
            { action: 'close', title: 'Жабу' }
        ]
    };

    console.log('[Worker] Showing background notification:', title, tag);
    return self.registration.showNotification(title, notificationOptions);
});

// 4. Listen for push events (Standard Web-Push fallback)
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

        console.log('[Worker] 📥 Push event received payload:', data)

        const title = data.notification?.title || data.title || 'Mazir Admin'
        const body = data.notification?.body || data.body || 'Жаңа хабарлама'
        
        // Build notification options
        const options = {
            body: body,
            icon: data.icon || data.notification?.icon || '/icon-192x192.png',
            badge: data.badge || '/icon-192x192.png',
            vibrate: data.vibrate || [500, 110, 500, 110, 450],
            tag: data.tag || data.notification?.tag || 'notification',
            requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
            renotify: true, // Make sure it vibrates even for same tag
            data: {
                dateOfArrival: Date.now(),
                url: data.url || data.data?.url || '/orders',
                orderId: data.orderId || data.data?.orderId,
            },
            actions: [
                { action: 'open', title: 'Ашу' },
                { action: 'close', title: 'Жабу' }
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

    const url = event.notification.data?.url || '/orders'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i]
                    if (client.url && client.url.includes(url) && 'focus' in client) {
                        return client.focus()
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url)
                }
            })
    )
})

