'use client'

import { useState, useEffect } from 'react'
import { getLocalCart, LocalCartItem } from '@/lib/storage/local-storage'

export function useCart() {
  const [cart, setCart] = useState<LocalCartItem[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const updateCart = () => {
      const items = getLocalCart()
      setCart(items)
      
      const price = items.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0)
      const count = items.reduce((sum, item) => sum + item.quantity, 0)
      
      setTotalPrice(price)
      setTotalCount(count)
    }

    // Initial load
    updateCart()

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCart)
    return () => window.removeEventListener('cartUpdated', updateCart)
  }, [])

  return { cart, totalPrice, totalCount }
}
