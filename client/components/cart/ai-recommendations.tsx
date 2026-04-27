'use client'

import { useState, useEffect } from 'react'
import { getRecommendations } from '@/lib/recommendations'
import { MenuItemCard } from '@/components/restaurant/menu-item-card'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Sparkles, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AIRecommendationsProps {
    cartItemIds: string[]
    restaurantId: string
}

export function AIRecommendations({ cartItemIds, restaurantId }: AIRecommendationsProps) {
    const { locale } = useI18n()
    const [recommendations, setRecommendations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (cartItemIds.length === 0) {
            setRecommendations([])
            setLoading(false)
            return
        }

        async function fetchRecs() {
            setLoading(true)
            try {
                const data = await getRecommendations(cartItemIds, restaurantId)
                setRecommendations(data)
            } catch (err) {
                console.error('Recs error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchRecs()
    }, [cartItemIds.join(','), restaurantId])

    if (loading) return (
        <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-4 overflow-hidden">
                {[1, 2].map(i => (
                    <div key={i} className="w-64 h-32 bg-muted animate-pulse rounded-3xl shrink-0" />
                ))}
            </div>
        </div>
    )

    if (recommendations.length === 0) return null

    return (
        <section className="py-4 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                        {locale === 'ru' ? 'С этим часто берут' : 'Осымен бірге жиі алады'}
                    </h3>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-1 -mx-1">
                <AnimatePresence mode="popLayout">
                    {recommendations.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.1 }}
                            className="w-72 shrink-0"
                        >
                            <MenuItemCard 
                                item={item} 
                                isOpen={true} 
                                layout="horizontal"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    )
}
