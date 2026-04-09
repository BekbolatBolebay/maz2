import { createClient } from '@/lib/supabase/server'

export type Restaurant = {
    id: string
    owner_id: string
    name_kk: string
    name_ru: string
    name_en: string
    description_kk: string
    description_ru: string
    description_en: string
    image_url: string
    banner_url: string
    address: string
    phone: string
    rating: number
    delivery_time_min: number
    delivery_time_max: number
    delivery_fee: number
    minimum_order: number
    is_open: boolean
    status: 'open' | 'closed' | 'paused'
    opening_hours: any
    cuisine_types: string[]
    total_seats?: number
    kaspi_link?: string
    freedom_merchant_id?: string
    freedom_payment_secret_key?: string
    freedom_receipt_secret_key?: string
    payment_type?: 'MANUAL' | 'AUTOMATED'
    accept_cash: boolean
    accept_kaspi: boolean
    accept_freedom: boolean
    is_delivery_enabled: boolean
    is_pickup_enabled: boolean
    is_booking_enabled: boolean
    is_new: boolean
    created_at: string
    updated_at: string
}

export type Table = {
    id: string
    cafe_id: string
    table_number: string
    capacity: number
    is_active: boolean
}

export type Category = {
    id: string
    cafe_id: string
    name_kk: string
    name_ru: string
    name_en: string
    icon_url: string
    sort_order: number
    is_active: boolean
    created_at: string
}

export type MenuItem = {
    id: string
    cafe_id: string
    category_id: string | null
    name_kk: string
    name_ru: string
    name_en: string
    description_kk: string
    description_ru: string
    description_en: string
    image_url: string
    price: number
    original_price: number | null
    is_available: boolean
    is_popular: boolean
    is_stop_list: boolean
    preparation_time: number
    sort_order: number
    created_at: string
    updated_at: string
    categories?: Category
}

export async function getCurrentRestaurantId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    return data?.id || null
}

export async function getCafeSettings(): Promise<Restaurant | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()
    return data
}

export async function getMenuCategories(): Promise<Category[]> {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return []

    const supabase = await createClient()
    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('cafe_id', restaurantId)
        .order('sort_order', { ascending: true })
    return data || []
}

export async function getMenuItems(): Promise<MenuItem[]> {
    const restaurantId = await getCurrentRestaurantId()
    if (!restaurantId) return []

    const supabase = await createClient()
    const { data } = await supabase
        .from('menu_items')
        .select('*, categories(id, name_kk, name_ru)')
        .eq('cafe_id', restaurantId)
        .order('sort_order', { ascending: true })
    return data || []
}

export type WorkingHour = {
    id: string
    cafe_id: string
    day_of_week: number
    open_time: string | null
    close_time: string | null
    is_day_off: boolean
    created_at: string
    updated_at: string
}

export async function getWorkingHours(restaurantId: string): Promise<WorkingHour[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('working_hours')
        .select('*')
        .eq('cafe_id', restaurantId)
        .order('day_of_week', { ascending: true })
    return data || []
}
