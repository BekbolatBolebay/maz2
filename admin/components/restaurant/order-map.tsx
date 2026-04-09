'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation } from 'lucide-react'

// Fix for default marker icons in Leaflet with Next.js
const getDefaultIcon = () => {
    if (typeof window === 'undefined') return undefined
    return L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    })
}

interface OrderMapProps {
    latitude: number
    longitude: number
    customerName: string
    address?: string
}

export default function OrderMap({ latitude, longitude, customerName, address }: OrderMapProps) {
    const position = new L.LatLng(latitude, longitude)

    return (
        <div className="w-full rounded-2xl overflow-hidden border border-primary/10 shadow-sm mt-3 bg-muted/30">
            <div className="p-3 bg-card flex items-center justify-between border-b border-primary/5">
                <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold">{customerName}</span>
                </div>
            </div>
            <div className="h-[200px] w-full relative z-0">
                <MapContainer
                    center={position}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position} icon={getDefaultIcon()} />
                </MapContainer>
            </div>
            <div className="p-2 flex justify-center bg-card">
                <a
                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1"
                >
                    <MapPin className="w-3 h-3" /> Google Maps
                </a>
            </div>
        </div>
    )
}
