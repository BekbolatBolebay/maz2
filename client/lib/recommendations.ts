'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRecommendations(itemIds: string[], restaurantId: string) {
    const supabase = await createClient()

    if (itemIds.length === 0) return []

    // 1. Get IDs of orders that contain ANY of the items in the current cart
    const { data: orderIdsData } = await supabase
        .from('order_items')
        .select('order_id')
        .in('menu_item_id', itemIds)
        .limit(200)
    
    const orderIds = Array.from(new Set((orderIdsData || []).map(o => o.order_id)))

    if (orderIds.length === 0) {
        // Fallback: Just get popular items from this restaurant
        const { data: popular } = await supabase
            .from('menu_items')
            .select(`
                *,
                restaurant:restaurants!cafe_id (
                    id,
                    name_ru,
                    name_en,
                    happy_hour_start,
                    happy_hour_end,
                    happy_hour_discount_percent,
                    happy_hour_days
                )
            `)
            .eq('cafe_id', restaurantId)
            .eq('is_available', true)
            .eq('is_popular', true)
            .not('id', 'in', `(${itemIds.join(',')})`)
            .limit(4)
        
        return popular || []
    }

    // 2. Find other items that were in those same orders
    const { data: relatedItemsData } = await supabase
        .from('order_items')
        .select('menu_item_id')
        .in('order_id', orderIds)
        .not('menu_item_id', 'in', `(${itemIds.join(',')})`)
    
    // 3. Count occurrences
    const counts: Record<string, number> = {}
    relatedItemsData?.forEach(item => {
        counts[item.menu_item_id] = (counts[item.menu_item_id] || 0) + 1
    })

    // 4. Get the top items
    const topItemIds = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([id]) => id)
    
    if (topItemIds.length === 0) {
        // Fallback again
        const { data: popular } = await supabase
            .from('menu_items')
            .select(`
                *,
                restaurant:restaurants!cafe_id (
                    id,
                    name_ru,
                    name_en,
                    happy_hour_start,
                    happy_hour_end,
                    happy_hour_discount_percent,
                    happy_hour_days
                )
            `)
            .eq('cafe_id', restaurantId)
            .eq('is_available', true)
            .not('id', 'in', `(${itemIds.join(',')})`)
            .limit(4)
        return popular || []
    }

    const { data: recommended } = await supabase
        .from('menu_items')
        .select(`
            *,
            restaurant:restaurants!cafe_id (
                id,
                name_ru,
                name_en,
                happy_hour_start,
                happy_hour_end,
                happy_hour_discount_percent,
                happy_hour_days
            )
        `)
        .in('id', topItemIds)
    
    return recommended || []
}
