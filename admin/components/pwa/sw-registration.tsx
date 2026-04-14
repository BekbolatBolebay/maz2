'use client'

import { useEffect } from 'react'

export function SWRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          console.log('PWA: Starting service worker registration...')
          
          // Register the main PWA service worker first
          const reg = await navigator.serviceWorker.register('/sw.js', { 
            scope: '/',
            updateViaCache: 'none' 
          })
          
          if (reg) {
            console.log('PWA: Main Service Worker registered successfully:', reg.scope)
            
            // Wait for the SW to be active if it's the first time
            if (reg.installing) {
              console.log('PWA: Service worker is installing...')
            } else if (reg.active) {
              console.log('PWA: Service worker is already active')
            }

            // Register Firebase messaging worker separately with specific scope
            // We do this after the main SW to avoid potential conflicts during bridge initialization
            try {
              const fcmReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
                scope: '/firebase-cloud-messaging-push-scope' 
              })
              console.log('PWA: Firebase Messaging Worker registered:', fcmReg.scope)
            } catch (fcmErr) {
              console.warn('PWA: Firebase Messaging registration failed (non-critical):', fcmErr)
            }
          }
        } catch (error) {
          console.error('PWA: Service Worker registration failure:', error)
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

