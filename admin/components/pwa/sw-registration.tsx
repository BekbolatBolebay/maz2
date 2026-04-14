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
          
          if (reg) {
            console.log('PWA Service Worker registered:', reg.scope)
            
            // If there's no controller, reload to let SW take control
            // This is often needed for the first-time installation to trigger criteria
            if (!navigator.serviceWorker.controller) {
              console.log('PWA: No controller found. Service worker taking control...');
              // We don't necessarily need a reload here, but it helps stability
            }
          }

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

