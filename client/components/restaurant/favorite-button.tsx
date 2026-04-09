'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import {
  toggleLocalFavorite,
  isLocalFavorite,
  toggleLocalFoodFavorite,
  isLocalFoodFavorite
} from '@/lib/storage/local-storage'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'

interface FavoriteButtonProps {
  restaurantId?: string
  menuItemId?: string
  className?: string
}

export function FavoriteButton({ restaurantId, menuItemId, className }: FavoriteButtonProps) {
  const { t } = useI18n()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  const id = restaurantId || menuItemId
  const type = restaurantId ? 'restaurant' : 'food'

  useEffect(() => {
    if (!id) return

    if (type === 'restaurant') {
      setIsFavorite(isLocalFavorite(id))
    } else {
      setIsFavorite(isLocalFoodFavorite(id))
    }
  }, [id, type])

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!id) return
    setLoading(true)

    try {
      let newState: boolean
      if (type === 'restaurant') {
        newState = toggleLocalFavorite(id)
      } else {
        newState = toggleLocalFoodFavorite(id)
      }

      setIsFavorite(newState)

      if (newState) {
        toast.success(t('addedToFavorites') || 'Добавлено в избранное')
      } else {
        toast.success(t('removedFromFavorites') || 'Удалено из избранного')
      }
    } catch (error) {
      console.error('[v0] Error toggling favorite:', error)
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className={`rounded-full bg-background/80 backdrop-blur hover:bg-background/90 ${className}`}
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart
        className={`h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : 'text-foreground'}`}
      />
    </Button>
  )
}
