'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Filter,
    X,
    ChevronDown,
    MapPin,
    Utensils,
    Tag,
    ArrowUpNarrowWide,
    CircleCheck,
    RotateCcw
} from 'lucide-react'
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Category {
    id: string
    name_ru: string
    name_kk: string
}

interface Restaurant {
    id: string
    name_ru: string
    name_kk: string
}

interface FilterDrawerProps {
    categories: Category[]
    cities: string[]
    restaurants: Restaurant[]
    currentParams: {
        category?: string
        city?: string
        minPrice?: string
        maxPrice?: string
        sort?: string
        restaurantId?: string
    }
}

export function FilterDrawer({ categories, cities, restaurants, currentParams }: FilterDrawerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)

    // Local state for filters
    const [city, setCity] = useState(currentParams.city || '')
    const [category, setCategory] = useState(currentParams.category || '')
    const [minPrice, setMinPrice] = useState(currentParams.minPrice || '')
    const [maxPrice, setMaxPrice] = useState(currentParams.maxPrice || '')
    const [sort, setSort] = useState(currentParams.sort || '')
    const [restaurantId, setRestaurantId] = useState(currentParams.restaurantId || '')

    useEffect(() => {
        setCity(currentParams.city || '')
        setCategory(currentParams.category || '')
        setMinPrice(currentParams.minPrice || '')
        setMaxPrice(currentParams.maxPrice || '')
        setSort(currentParams.sort || '')
        setRestaurantId(currentParams.restaurantId || '')
    }, [
        currentParams.city,
        currentParams.category,
        currentParams.minPrice,
        currentParams.maxPrice,
        currentParams.sort,
        currentParams.restaurantId
    ])

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (city) params.set('city', city); else params.delete('city')
        if (category) params.set('category', category); else params.delete('category')
        if (minPrice) params.set('minPrice', minPrice); else params.delete('minPrice')
        if (maxPrice) params.set('maxPrice', maxPrice); else params.delete('maxPrice')
        if (sort) params.set('sort', sort); else params.delete('sort')
        if (restaurantId) params.set('restaurantId', restaurantId); else params.delete('restaurantId')

        // Default to food tab if filtering by price/sort
        if (minPrice || maxPrice || sort || restaurantId) {
            params.set('tab', 'food')
        }

        router.push(`/restaurants?${params.toString()}`)
        setIsOpen(false)
    }

    const resetFilters = () => {
        setCity('')
        setCategory('')
        setMinPrice('')
        setMaxPrice('')
        setSort('')
        setRestaurantId('')
    }

    const isFiltered = city || category || minPrice || maxPrice || sort || restaurantId

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 shrink-0 relative border-muted bg-background hover:bg-muted/50 transition-all">
                    <Filter className="w-5 h-5" />
                    {isFiltered && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[8px] font-black text-primary-foreground flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in duration-300">
                            !
                        </span>
                    )}
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] bg-background border-none shadow-2xl rounded-t-[2.5rem]">
                <div className="mx-auto w-10 h-1 rounded-full bg-muted/40 mt-3 mb-1" />
                <div className="max-w-md mx-auto w-full flex flex-col h-full overflow-hidden">
                    <DrawerHeader className="px-6 pb-2 pt-1 border-b border-muted/30">
                        <div className="flex items-center justify-between">
                            <DrawerTitle className="text-xl font-black italic tracking-tighter text-foreground/90 uppercase">Сүзгілеу</DrawerTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="text-[9px] font-black text-muted-foreground hover:text-destructive h-7 px-3 bg-muted/20 rounded-full transition-all active:scale-95"
                            >
                                <RotateCcw className="w-2.5 h-2.5 mr-1" /> ТАЗАЛАУ
                            </Button>
                        </div>
                    </DrawerHeader>

                    <ScrollArea className="flex-1 px-6">
                        <div className="space-y-8 py-6 pb-32">
                            {/* Sort Section */}
                            <section className="space-y-3">
                                <h4 className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <ArrowUpNarrowWide className="w-3 h-3 text-primary" /> Сұрыптау
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'price_asc', label: 'Арзан', short: '₸↑' },
                                        { id: 'price_desc', label: 'Қымбат', short: '₸↓' },
                                        { id: 'rating_desc', label: 'Рейтинг', short: '⭐' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSort(opt.id === sort ? '' : opt.id)}
                                            className={cn(
                                                "group flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1 relative overflow-hidden",
                                                sort === opt.id
                                                    ? "border-primary/50 bg-primary/5 text-primary shadow-sm"
                                                    : "border-muted/50 bg-muted/5 text-muted-foreground hover:border-primary/20 hover:bg-muted/10 font-medium"
                                            )}
                                        >
                                            <span className={cn("text-base font-black transition-transform", sort === opt.id ? "scale-110" : "group-hover:scale-110")}>{opt.short}</span>
                                            <span className="text-[9px] font-bold text-center leading-tight">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 gap-8">
                                {/* City Section */}
                                <section className="space-y-3">
                                    <h4 className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 px-1">
                                        <MapPin className="w-3 h-3 text-primary" /> Қала
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cities.map((c) => (
                                            <Badge
                                                key={c}
                                                variant={city === c ? "default" : "outline"}
                                                onClick={() => setCity(city === c ? '' : c)}
                                                className={cn(
                                                    "cursor-pointer py-1.5 px-3.5 rounded-full text-[10px] font-black transition-all border shadow-none",
                                                    city === c
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "bg-background border-muted/50 text-muted-foreground hover:border-primary/40"
                                                )}
                                            >
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                </section>

                                {/* Price Section */}
                                <section className="space-y-3">
                                    <h4 className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 px-1">
                                        ₸ Баға (₸)
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 relative">
                                            <Input
                                                type="number"
                                                placeholder="Мин"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                                className="h-11 rounded-1.5xl bg-muted/10 border-muted placeholder:font-bold font-black text-sm px-4 focus-visible:ring-primary/20"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-black opacity-30">₸</span>
                                        </div>
                                        <div className="w-2 h-[2px] bg-muted/50 rounded-full" />
                                        <div className="flex-1 relative">
                                            <Input
                                                type="number"
                                                placeholder="Макс"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                className="h-11 rounded-1.5xl bg-muted/10 border-muted placeholder:font-bold font-black text-sm px-4 focus-visible:ring-primary/20"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-black opacity-30">₸</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Category Section */}
                            <section className="space-y-3">
                                <h4 className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Tag className="w-3 h-3 text-primary" /> Категориялар
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map((cat) => {
                                        const isSel = category === cat.name_ru
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategory(isSel ? '' : cat.name_ru)}
                                                className={cn(
                                                    "group flex items-center gap-2.5 p-2 px-3 rounded-2xl border transition-all relative overflow-hidden",
                                                    isSel
                                                        ? "border-primary/50 bg-primary/5 shadow-sm"
                                                        : "border-muted/50 bg-muted/5 hover:border-primary/30"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0",
                                                    isSel ? "border-primary bg-primary" : "border-muted-foreground/10 bg-background group-hover:border-primary/30"
                                                )}>
                                                    {isSel ? (
                                                        <CircleCheck className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/10" />
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-black leading-tight truncate",
                                                    isSel ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                                )}>
                                                    {cat.name_kk}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Cafe Section */}
                            <section className="space-y-3">
                                <h4 className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Utensils className="w-3 h-3 text-primary" /> Кафе таңдау
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {restaurants.slice(0, 8).map((rest) => {
                                        const isSel = restaurantId === rest.id
                                        return (
                                            <button
                                                key={rest.id}
                                                onClick={() => setRestaurantId(isSel ? '' : rest.id)}
                                                className={cn(
                                                    "group w-full flex items-center justify-between p-3.5 px-5 rounded-2.5xl border transition-all active:scale-[0.98]",
                                                    isSel
                                                        ? "border-primary/50 bg-primary/5 shadow-sm"
                                                        : "border-muted/50 bg-muted/5 hover:border-primary/30"
                                                )}
                                            >
                                                <span className={cn("text-[11px] font-black transition-colors truncate pr-4", isSel ? "text-primary" : "text-foreground group-hover:text-primary")}>
                                                    {rest.name_kk}
                                                </span>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
                                                    isSel ? "border-primary bg-primary" : "border-muted/50 bg-background"
                                                )}>
                                                    {isSel && <CircleCheck className="w-3 h-3 text-primary-foreground fill-current" />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>
                        </div>
                    </ScrollArea>

                    <div className="p-6 bg-background/90 backdrop-blur-sm pt-2 border-t border-muted/30 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]">
                        <Button
                            onClick={applyFilters}
                            className="w-full h-12 rounded-2xl text-base font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98] uppercase tracking-wider"
                        >
                            НӘТИЖЕЛЕРДІ КӨРСЕТУ
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
