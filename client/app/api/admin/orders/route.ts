import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all orders
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const restaurantId = searchParams.get('cafe_id')
  const limit = searchParams.get('limit')

  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select(`
      *,
      users(full_name, phone),
      restaurants!cafe_id(name_en, name_ru, phone),
      order_items(*, menu_items(name_en, name_ru, image_url))
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (restaurantId) {
    query = query.eq('cafe_id', restaurantId)
  }

  if (limit) {
    query = query.limit(parseInt(limit))
  }

  const { data, error } = await query

  if (error) {
    return createAdminError(error.message, 500)
  }

  return createAdminResponse({ orders: data })
}

// PUT update order status
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, status, estimated_delivery_time } = body

    if (!id || !status) {
      return createAdminError('Order ID and status are required', 400)
    }

    const validStatuses = ['pending', 'preparing', 'on_the_way', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return createAdminError('Invalid status', 400)
    }

    const supabase = await createClient()
    const updates: any = { status }

    if (status === 'preparing') {
      updates.preparing_at = new Date().toISOString()
    } else if (status === 'on_the_way') {
      updates.out_for_delivery_at = new Date().toISOString()
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString()
    }

    if (estimated_delivery_time) {
      updates.estimated_delivery_time = estimated_delivery_time
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createAdminError(error.message, 500)
    }

    return createAdminResponse({ order: data })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE cancel order
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('Order ID is required', 400)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return createAdminError(error.message, 500)
  }

  return createAdminResponse({ order: data, message: 'Order cancelled successfully' })
}
