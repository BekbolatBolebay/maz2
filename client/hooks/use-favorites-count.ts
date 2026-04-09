'use client'

import { useState, useEffect } from 'react'
import { getLocalFavorites, getLocalFoodFavorites } from '@/lib/storage/local-storage'

export function useFavoritesCount() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const updateCount = () => {
            const restaurants = getLocalFavorites()
            const food = getLocalFoodFavorites()
            setCount(restaurants.length + food.length)
        }

        // Initial load
        updateCount()

        // Listen for favorites updates
        window.addEventListener('favoritesUpdated', updateCount)
        return () => window.removeEventListener('favoritesUpdated', updateCount)
    }, [])

    return count
}
