'use client'

import dynamic from 'next/dynamic'

const MapContent = dynamic(() => import('./restaurant-map-content'), {
    ssr: false,
    loading: () => <div className="h-[180px] w-full bg-muted animate-pulse rounded-2xl mt-4" />
})

interface RestaurantMapProps {
    latitude: number
    longitude: number
    restaurantName: string
    address?: string
}

export default function RestaurantMap(props: RestaurantMapProps) {
    return <MapContent {...props} />
}
