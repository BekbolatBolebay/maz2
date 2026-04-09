/**
 * Service Worker for client app - handles push notifications
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
            orderNumber: data.orderNumber,
            timestamp: new Date().toISOString(),
        })

        // Build notification options
        const options = {
            body: data.body || 'Order status update',
            icon: data.icon || '/icon-192x192.png',
            badge: '/icon-light-32x32.png',
            vibrate: [100, 50, 100],
            tag: data.tag || `order-notification-${Date.now()}`, // Use tag to group notifications
            requireInteraction: data.requireInteraction || false,
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.tag || 'order-notification',
                url: data.url || '/',
                orderId: data.orderId,
                orderNumber: data.orderNumber,
                status: data.status,
            },
            actions: [
                {
                    action: 'open',
                    title: 'Посмотреть' // Russian: "View"
                },
                {
                    action: 'close',
                    title: 'Закрыть' // Russian: "Close"
                }
            ]
        }

        const title = data.title || 'Order Update'

        console.log('[Worker] Showing notification:', { title, status: data.status, tag: options.tag })

        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => {
                    console.log('[Worker] Notification displayed successfully for order:', data.orderNumber)
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
        orderNumber: event.notification.data?.orderNumber,
    })

    event.notification.close()

    // Don't open window if user clicked 'close'
    if (event.action === 'close') {
        console.log('[Worker] Close action selected')
        return
    }

    const url = event.notification.data?.url || '/'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                console.log('[Worker] Found open client windows:', clientList.length)

                // Try to find an existing window
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i]
                    if (client.url && 'focus' in client) {
                        console.log('[Worker] Focusing existing window')
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

// Handle notification close events
self.addEventListener('notificationclose', function (event) {
    console.log('[Worker] Notification closed:', {
        tag: event.notification.tag,
        orderNumber: event.notification.data?.orderNumber,
        timestamp: new Date().toISOString(),
    })
})

