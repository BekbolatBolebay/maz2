'use client'

import { useEffect } from 'react'

export function SWRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // Register the main PWA service worker first
          const reg = await navigator.serviceWorker.register('/sw.js', { 
            scope: '/',
            updateViaCache: 'none' 
          })
          console.log('PWA Service Worker registered:', reg.scope)

          // Wait until the main worker is ready before registering FCM
          await navigator.serviceWorker.ready

          // Register Firebase messaging worker separately with specific scope
          const fcmReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
            scope: '/firebase-cloud-messaging-push-scope' 
          })
          console.log('Firebase Service Worker registered:', fcmReg.scope)
        } catch (error) {
          console.error('Service Worker registration failure:', error)
        }
      }

      // Register early but without blocking the main thread
      if (document.readyState === 'complete') {
        registerSW()
      } else {
        window.addEventListener('load', registerSW)
        return () => window.removeEventListener('load', registerSW)
      }
    }
  }, [])

  return null
}

