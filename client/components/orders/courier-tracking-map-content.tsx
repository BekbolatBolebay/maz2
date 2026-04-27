'use client'

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

// Custom Icons
const CourierIcon = L.divIcon({
    html: `<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-xl animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
})

const CustomerIcon = L.divIcon({
    html: `<div class="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
})

interface MapProps {
    courierPos: { lat: number, lng: number } | null
    customerLat: number
    customerLng: number
}

function MapResizer({ courierPos, customerLat, customerLng }: MapProps) {
    const map = useMap()

    useEffect(() => {
        if (!courierPos) {
            map.setView([customerLat, customerLng], 15)
            return
        }

        const bounds = L.latLngBounds(
            [courierPos.lat, courierPos.lng],
            [customerLat, customerLng]
        )
        map.fitBounds(bounds, { padding: [50, 50] })
    }, [courierPos, customerLat, customerLng, map])

    return null
}

export default function CourierTrackingMapContent({ courierPos, customerLat, customerLng }: MapProps) {
    const customerPos = new L.LatLng(customerLat, customerLng)
    const courierLatLng = courierPos ? new L.LatLng(courierPos.lat, courierPos.lng) : null

    return (
        <div className="h-[300px] w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative z-0">
            <MapContainer
                center={customerPos}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <Marker position={customerPos} icon={CustomerIcon} />
                
                {courierLatLng && (
                    <Marker position={courierLatLng} icon={CourierIcon} />
                )}
                
                <MapResizer courierPos={courierPos} customerLat={customerLat} customerLng={customerLng} />
            </MapContainer>
        </div>
    )
}
