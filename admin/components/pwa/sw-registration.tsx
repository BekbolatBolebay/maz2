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
            console.log('PWA: Service Worker registered successfully:', reg.scope)
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

