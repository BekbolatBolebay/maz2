'use client'

import { useEffect } from 'react'

export function SWRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Register the main PWA service worker if not already handled by next-pwa
          // We check existence first to avoid redundant logs/registration
          const registrations = await navigator.serviceWorker.getRegistrations()
          const hasMainSW = registrations.some(r => r.active?.scriptURL.includes('/sw.js'))

          if (!hasMainSW) {
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
            console.log('PWA Service Worker registered:', reg.scope)
          }

          // Register Firebase messaging worker separately
          // This is often needed for background push notifications to work correctly with FCM
          const hasFirebaseSW = registrations.some(r => r.active?.scriptURL.includes('/firebase-messaging-sw.js'))
          
          if (!hasFirebaseSW) {
            const fcmReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' })
            console.log('Firebase Service Worker registered:', fcmReg.scope)
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }

      window.addEventListener('load', registerSW)
      return () => window.removeEventListener('load', registerSW)
    }
  }, [])

  return null
}

