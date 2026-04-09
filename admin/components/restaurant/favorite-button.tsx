'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
    restaurantId: string
}

export function FavoriteButton({ restaurantId }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(false)

    return (
        <Button
            size="icon"
            variant="ghost"
            className={cn(
                "rounded-full bg-background/80 backdrop-blur hover:bg-background/90 transition-all",
                isFavorite && "text-red-500"
            )}
            onClick={() => setIsFavorite(!isFavorite)}
        >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </Button>
    )
}
