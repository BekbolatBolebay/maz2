import { getMenuItems, getMenuCategories, getCurrentRestaurantId } from '@/lib/db'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import { seedDefaultCategories } from '@/lib/actions'
import MenuClient from './menu-client'
import type { Category } from '@/lib/db'

export default async function MenuPage() {
  const restaurantId = await getCurrentRestaurantId()
  if (!restaurantId) return null

  const [items, dbCategories] = await Promise.all([
    getMenuItems(restaurantId), 
    getMenuCategories(restaurantId)
  ])

  // DB-де категориялар жоқ болса, автоматты тұқым ету + fallback
  let categories: Category[] = dbCategories
  if (dbCategories.length === 0) {
    // Автоматты тұқым ету (SQL скрипті іске қосылмаған болса)
    await seedDefaultCategories(false, restaurantId)
    const seeded = await getMenuCategories(restaurantId)
    // DB-дан алынған болса оларды қолдан, болмаса DEFAULT_CATEGORIES-ті форма үшін қолдан
    categories = seeded.length > 0 ? seeded : DEFAULT_CATEGORIES.map((c, i) => ({
      id: `default-${i}`,
      cafe_id: restaurantId,
      name_kk: c.name_kk,
      name_ru: c.name_ru,
      name_en: c.name_en,
      icon_url: '',
      sort_order: c.sort_order,
      is_active: true,
      created_at: '',
    }))
  }

  return <MenuClient initialItems={items} initialCategories={categories} restaurantId={restaurantId} />
}

