'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin } from 'lucide-react'

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})

interface RestaurantMapProps {
    latitude: number
    longitude: number
    restaurantName: string
    address?: string
}

export default function RestaurantMapContent({ latitude, longitude, restaurantName, address }: RestaurantMapProps) {
    const position = new L.LatLng(latitude, longitude)

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-primary/10 shadow-sm mt-4 bg-muted/30">
            <div className="p-3 bg-card flex items-center justify-between border-b border-primary/5">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold">{restaurantName}</span>
                </div>
                {address && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{address}</span>}
            </div>
            <div className="h-[180px] w-full relative z-0">
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                    dragging={false}
                    zoomControl={false}
                    touchZoom={false}
                    doubleClickZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position} icon={DefaultIcon} />
                </MapContainer>
                {/* Overlay to catch clicks and prevent map interaction since it's meant for display only */}
                <div className="absolute inset-0 z-[1000] cursor-default" />
            </div>
            <div className="p-2 flex justify-center bg-card/50">
                <a
                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                >
                    Google Maps-те ашу
                </a>
            </div>
        </div>
    )
}
