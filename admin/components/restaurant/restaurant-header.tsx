'use client'

import Image from 'next/image'
import { ArrowLeft, Star, Clock, MapPin, Phone, Share2, Image as ImageIcon, Upload as UploadIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import ImageUpload from '@/components/ui/image-upload'

interface RestaurantHeaderProps {
    restaurant: {
        id: string
        name_ru?: string
        name_kk?: string
        name_en?: string
        description_ru?: string
        description_kk?: string
        description_en?: string
        banner_url?: string
        image_url?: string
        rating?: number
        delivery_time_min?: number
        delivery_time_max?: number
        delivery_fee?: number
        address?: string
        phone?: string
        status?: string
    }
    isOpen?: boolean
    workingHoursText?: string
    isAdmin?: boolean
    onBannerUpload?: (url: string) => void
    onLogoUpload?: (url: string) => void
    backHref?: string
    lang?: 'kk' | 'ru' | 'en'
    actions?: React.ReactNode
}

export function RestaurantHeader({
    restaurant,
    isOpen,
    workingHoursText,
    isAdmin,
    onBannerUpload,
    onLogoUpload,
    backHref = '/',
    lang = 'ru',
    actions
}: RestaurantHeaderProps) {
    const name = restaurant[`name_${lang}`] || restaurant.name_ru || restaurant.name_en || ''
    const description = restaurant[`description_${lang}`] || restaurant.description_ru || restaurant.description_en || ''

    return (
        <div className="relative">
            {/* Dynamic Banner Section */}
            <div className="relative h-64 bg-slate-950 overflow-hidden">
                {restaurant.banner_url ? (
                    <Image
                        src={restaurant.banner_url}
                        alt={name}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center">
                        <span className="text-primary/20 font-bold text-2xl tracking-widest uppercase">
                            {name}
                        </span>
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

                {/* Top Actions */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-30">
                    <Link href={backHref}>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white border-0"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>

                    <div className="flex gap-2">
                        {isAdmin && onBannerUpload && (
                            <ImageUpload
                                value={restaurant.banner_url}
                                onChange={onBannerUpload}
                                aspectRatio="banner"
                            >
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white border-0"
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </Button>
                            </ImageUpload>
                        )}
                        {actions}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white border-0"
                        >
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Info Overlay (Logo + Name) */}
                <div className="absolute bottom-10 left-4 right-4 z-30 flex items-end gap-4">
                    <div className="relative group">
                        {isAdmin && onLogoUpload && (
                            <div className="absolute inset-0 z-20 opacity-0 cursor-pointer">
                                <ImageUpload
                                    value={restaurant.image_url}
                                    onChange={onLogoUpload}
                                    aspectRatio="square"
                                />
                            </div>
                        )}
                        <div className="w-20 h-20 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center shadow-2xl overflow-hidden shrink-0">
                            {restaurant.image_url ? (
                                <Image
                                    src={restaurant.image_url}
                                    alt="logo"
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-bold text-primary">CAFE</span>
                            )}
                            {isAdmin && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                    <UploadIcon className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-1 flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-white truncate drop-shadow-md">
                            {name}
                        </h1>
                        {description && (
                            <p className="text-slate-300 text-sm line-clamp-1 drop-shadow-sm font-medium">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status indicator (Pulsing badge) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background to-transparent pt-8">
                    {isOpen !== undefined && (
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                isOpen
                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                            )}>
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full mr-0.5",
                                    isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
                                )} />
                                {isOpen ? (lang === 'kk' ? 'АШЫҚ' : 'ОТКРЫТО') : (lang === 'kk' ? 'ЖАБЫҚ' : 'ЗАКРЫТО')}
                                {isOpen && workingHoursText && <span className="opacity-60 ml-1">• {workingHoursText}</span>}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
