'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/i18n'
import { useApp } from '@/lib/app-context'
import { MapPin, Navigation, Search, Loader2, X } from 'lucide-react'

// Fix for default marker icons in Leaflet with Next.js
if (typeof window !== 'undefined') {
    const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    })
    L.Marker.prototype.options.icon = DefaultIcon
}

interface MapPickerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (lat: number, lng: number, address?: string) => void
    initialCoords?: { lat: number; lng: number } | null
}

function LocationMarker({ position, setPosition }: { position: L.LatLng, setPosition: (pos: L.LatLng) => void }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())
        },
    })

    return position ? <Marker position={position} /> : null
}

function ChangeView({ center }: { center: L.LatLngExpression }) {
    const map = useMap()
    useEffect(() => {
        map.setView(center)
    }, [center, map])
    return null
}

export function MapPicker({ open, onOpenChange, onSelect, initialCoords }: MapPickerProps) {
    const { lang } = useApp()
    const [position, setPosition] = useState<L.LatLng>(
        new L.LatLng(initialCoords?.lat || 43.2389, initialCoords?.lng || 76.8897) // Default to Almaty
    )
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (initialCoords?.lat && initialCoords?.lng) {
            setPosition(new L.LatLng(initialCoords.lat, initialCoords.lng))
        }
    }, [initialCoords])

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)

        if (!query.trim() || query.length < 3) {
            setSearchResults([])
            return
        }

        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ru,kk`)
                const data = await res.json()
                setSearchResults(data)
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setIsSearching(false)
            }
        }, 500)
    }

    const handleSelectResult = (result: any) => {
        const newPos = new L.LatLng(parseFloat(result.lat), parseFloat(result.lon))
        setPosition(newPos)
        setSearchResults([])
        setSearchQuery(result.display_name)
    }

    const handleConfirm = async () => {
        setLoading(true)
        try {
            // Reverse geocoding using Nominatim (free)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=ru,kk`)
            const data = await res.json()
            const displayName = data.display_name || ''
            onSelect(position.lat, position.lng, displayName)
            onOpenChange(false)
        } catch (error) {
            console.error('Geocoding error:', error)
            onSelect(position.lat, position.lng)
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude))
            }, (err) => {
                console.error('Geolocation error:', err)
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden flex flex-col h-[80vh]">
                <DialogHeader className="p-4 border-b space-y-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="text-primary w-5 h-5 shrink-0" />
                        <span>{t(lang, 'selectLocation')}</span>
                    </DialogTitle>

                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={t(lang, 'search')}
                                className="pl-10 pr-10"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            )}
                            {isSearching && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                            )}
                        </div>

                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-xl overflow-hidden z-[1200]">
                                {searchResults.map((result, i) => (
                                    <button
                                        key={i}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-b last:border-0 flex items-start gap-3"
                                        onClick={() => handleSelectResult(result)}
                                    >
                                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{result.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 relative min-h-[400px]">
                    <MapContainer
                        center={position}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                        <ChangeView center={position} />
                    </MapContainer>

                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute bottom-6 right-6 z-[1000] shadow-xl bg-background"
                        onClick={handleGetCurrentLocation}
                    >
                        <Navigation className="w-5 h-5 text-primary" />
                    </Button>
                </div>

                <DialogFooter className="p-4 border-t">
                    <Button
                        className="w-full h-12 text-lg font-bold"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t(lang, 'confirmLocation')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
