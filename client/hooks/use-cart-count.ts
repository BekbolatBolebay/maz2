'use client'

import { useState, useEffect } from 'react'
import { getLocalCart } from '@/lib/storage/local-storage'

export function useCartCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Calculate count from local storage
    const updateCount = () => {
      const cart = getLocalCart()
      const total = cart.reduce((sum, item) => sum + item.quantity, 0)
      setCount(total)
    }

    // Initial load
    updateCount()

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCount)
    return () => window.removeEventListener('cartUpdated', updateCount)
  }, [])

  return count
}
