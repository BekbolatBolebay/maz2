'use client'

import { useState, useEffect } from 'react'
import { getLocalCart, LocalCartItem } from '@/lib/storage/local-storage'

export function useLocalCart() {
  const [cart, setCart] = useState<LocalCartItem[]>([])

  useEffect(() => {
    // Load cart on mount
    setCart(getLocalCart())

    // Listen for cart updates
    const handleCartUpdate = () => {
      setCart(getLocalCart())
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [])

  return cart
}
