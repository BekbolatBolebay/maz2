'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { RestaurantSection } from '@/components/home/restaurant-section'
import { FoodSection } from '@/components/home/food-section'
import { getLocalFavorites, getLocalFoodFavorites } from '@/lib/storage/local-storage'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

type Restaurant = Database['public']['Tables']['restaurants']['Row']
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  restaurants: Restaurant | null
}

export default function FavoritesPage() {
  const { t } = useI18n()
  const supabase = createClient()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [foodItems, setFoodItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'food' | 'cafes'>('cafes')

  useEffect(() => {
    async function loadFavorites() {
      const favoriteIds = getLocalFavorites()
      const favoriteFoodIds = getLocalFoodFavorites()

      try {
        const [resRestaurants, resFood] = await Promise.all([
          favoriteIds.length > 0
            ? supabase.from('restaurants').select('*').in('id', favoriteIds)
            : Promise.resolve({ data: [] }),
          favoriteFoodIds.length > 0
            ? supabase.from('menu_items').select('*, restaurants(*)').in('id', favoriteFoodIds)
            : Promise.resolve({ data: [] })
        ])

        if (resRestaurants.data) setRestaurants(resRestaurants.data)
        if (resFood.data) setFoodItems(resFood.data as any)
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()

    // Listen for updates and reload
    window.addEventListener('favoritesUpdated', loadFavorites)
    return () => window.removeEventListener('favoritesUpdated', loadFavorites)
  }, [])

  const hasAnyFavorites = activeTab === 'cafes' ? restaurants.length > 0 : foodItems.length > 0

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <Header title={t.common.favorites} />

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            <button
              onClick={() => setActiveTab('cafes')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-center transition-all ${activeTab === 'cafes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
            >
              Кафе
            </button>
            <button
              onClick={() => setActiveTab('food')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-center transition-all ${activeTab === 'food' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
            >
              Тамақ
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : hasAnyFavorites ? (
            <>
              {activeTab === 'cafes' && restaurants.length > 0 && (
                <RestaurantSection restaurants={restaurants} />
              )}

              {activeTab === 'food' && foodItems.length > 0 && (
                <FoodSection title={t.home.topRated} items={foodItems} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-xl font-bold mb-2">{t.cart.empty || 'Бос'}</h2>
              <p className="text-muted-foreground mb-6">
                Сүйікті {activeTab === 'cafes' ? 'мейрамханаларыңызды' : 'тағамдарыңызды'} қосыңыз
              </p>
              <Link href="/restaurants" className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium">
                Қарау
              </Link>
            </div>
          )}
        </div>
      </main>

    </div>
  )
}
