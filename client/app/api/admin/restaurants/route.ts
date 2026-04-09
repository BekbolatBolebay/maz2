import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all restaurants
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return createAdminError(error.message, 500)
  }

  return createAdminResponse({ restaurants: data })
}

// POST create restaurant
export async function POST(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        name_kk: body.name_kk || body.name_en,
        name_ru: body.name_ru,
        name_en: body.name_en,
        description_kk: body.description_kk || body.description_en,
        description_ru: body.description_ru,
        description_en: body.description_en,
        address: body.address,
        phone: body.phone,
        image_url: body.image_url,
        banner_url: body.banner_url || body.image_url,
        rating: body.rating || 0,
        delivery_time_min: body.delivery_time_min || 20,
        delivery_time_max: body.delivery_time_max || 40,
        delivery_fee: body.delivery_fee || 0,
        minimum_order: body.minimum_order || 0,
        is_open: body.is_open ?? true,
        opening_hours: body.opening_hours,
        cuisine_types: body.cuisine_types || body.categories || [],
      })
      .select()
      .single()

    if (error) {
      return createAdminError(error.message, 500)
    }

    return createAdminResponse({ restaurant: data }, 201)
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// PUT update restaurant
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return createAdminError('Restaurant ID is required', 400)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createAdminError(error.message, 500)
    }

    return createAdminResponse({ restaurant: data })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE restaurant
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('Restaurant ID is required', 400)
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', id)

  if (error) {
    return createAdminError(error.message, 500)
  }

  return createAdminResponse({ message: 'Restaurant deleted successfully' })
}
