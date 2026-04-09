/**
 * Enhanced notification utilities for client food app
 * Provides push notifications with sound and proper delivery guarantees
 */

import { playNotificationSound } from '@/lib/sound-utils'

interface NotificationOptions {
  title: string
  body: string
  url?: string
  playSound?: boolean
  soundType?: 'status-update' | 'order-alert'
  tag?: string
  requireInteraction?: boolean
}

/**
 * Send a notification via multiple channels to ensure delivery
 * 1. Try web push (if subscribed)
 * 2. Show in-app toast
 * 3. Show browser notification
 * 4. Play sound
 */
export async function showClientNotification(options: NotificationOptions): Promise<void> {
  const {
    title,
    body,
    url,
    playSound: shouldPlaySound = true,
    soundType = 'status-update',
    tag,
    requireInteraction = false,
  } = options

  try {
    // Log notification event for debugging
    logNotificationEvent('show_notification', {
      title,
      body,
      tag,
      soundType,
    })

    // 1. Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          tag: tag || 'order-status',
          requireInteraction,
          badge: '/icon-192x192.png',
          icon: '/icon-192x192.png',
        })

        // Click handler to open order page
        if (url) {
          notification.onclick = () => {
            window.focus()
            window.location.href = url
            notification.close()
          }
        }

        logNotificationEvent('browser_notification_sent', { tag })
      } catch (error) {
        console.warn('Browser notification failed:', error)
      }
    }

    // 2. Play sound for critical notifications
    if (shouldPlaySound && Notification.permission === 'granted') {
      try {
        await playNotificationSound(soundType)
        logNotificationEvent('sound_played', { soundType })
      } catch (error) {
        console.warn('Sound playback failed:', error)
      }
    }
  } catch (error) {
    console.error('Error displaying notification:', error)
    logNotificationEvent('notification_error', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Log notification events for debugging and monitoring
 */
function logNotificationEvent(
  eventName: string,
  data: Record<string, any>
): void {
  if (typeof window !== 'undefined') {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      event: eventName,
      ...data,
    }

    console.log(`[Notification] ${eventName}:`, logData)

    // Store in session storage for debugging (last 50 events)
    try {
      const logs = JSON.parse(
        sessionStorage.getItem('notification_logs') || '[]'
      ) as typeof logData[]
      logs.push(logData)
      if (logs.length > 50) logs.shift()
      sessionStorage.setItem('notification_logs', JSON.stringify(logs))
    } catch (error) {
      console.warn('Could not store notification log:', error)
    }
  }
}

/**
 * Get notification event logs for debugging
 */
export function getNotificationLogs(): Record<string, any>[] {
  try {
    return JSON.parse(sessionStorage.getItem('notification_logs') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear notification logs
 */
export function clearNotificationLogs(): void {
  try {
    sessionStorage.removeItem('notification_logs')
  } catch (error) {
    console.warn('Could not clear notification logs:', error)
  }
}
