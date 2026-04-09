/**
 * Service Worker for handling push notifications
 * Handles push events and notification clicks
 */

// Listen for push notifications from backend
self.addEventListener('push', function (event) {
    try {
        let data = {}
        
        // Parse push event data
        if (event.data) {
            try {
                data = event.data.json()
            } catch (e) {
                console.error('[Worker] Failed to parse push data as JSON:', e)
                data = { body: event.data.text() }
            }
        }

        console.log('[Worker] Push notification received:', {
            title: data.title,
            status: data.status,
            timestamp: new Date().toISOString(),
        })

        // Build notification options
        const options = {
            body: data.body || 'Нет сообщения',
            icon: data.icon || '/icon-192x192.png',
            badge: '/icon-light-32x32.png',
            vibrate: [200, 100, 200, 100, 200],
            tag: data.tag || 'notification', // Use tag to prevent duplicates
            requireInteraction: data.requireInteraction || false,
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.tag || 'admin-notification',
                url: data.url || '/orders',
                orderNumber: data.orderNumber,
                orderId: data.orderId,
                status: data.status,
            },
            actions: [
                {
                    action: 'open',
                    title: 'Открыть'
                },
                {
                    action: 'close',
                    title: 'Закрыть'
                }
            ]
        }

        const title = data.title || 'Mazir Admin'

        console.log('[Worker] Showing notification:', { title, ...options })

        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => {
                    console.log('[Worker] Notification displayed successfully')
                })
                .catch((error) => {
                    console.error('[Worker] Failed to show notification:', error)
                })
        )
    } catch (error) {
        console.error('[Worker] Error handling push event:', error)
    }
})

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
    console.log('[Worker] Notification clicked:', {
        action: event.action,
        url: event.notification.data?.url,
        tag: event.notification.tag,
    })

    event.notification.close()

    // Don't open window if user clicked 'close'
    if (event.action === 'close') {
        console.log('[Worker] Close action selected, not opening window')
        return
    }

    const url = event.notification.data?.url || '/orders'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                console.log('[Worker] Found client windows:', clientList.length)

                // Try to find an existing window with the same URL
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i]
                    if (client.url && client.url.includes(url) && 'focus' in client) {
                        console.log('[Worker] Focusing existing window with URL:', url)
                        return client.focus()
                    }
                }

                // Open new window if none found
                if (clients.openWindow) {
                    console.log('[Worker] Opening new window with URL:', url)
                    return clients.openWindow(url)
                }
            })
            .catch(error => {
                console.error('[Worker] Error handling notification click:', error)
            })
    )
})

// Handle notification close events (optional)
self.addEventListener('notificationclose', function (event) {
    console.log('[Worker] Notification closed:', {
        tag: event.notification.tag,
        timestamp: new Date().toISOString(),
    })
})

