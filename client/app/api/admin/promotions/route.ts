import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all promotions
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return createAdminError(error.message, 500)
  }

  return createAdminResponse({ promotions: data })
}

// POST create promotion
export async function POST(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('promotions')
      .insert({
        title_en: body.title_en,
        title_ru: body.title_ru,
        description_en: body.description_en,
        description_ru: body.description_ru,
        discount_percent: body.discount_percent,
        code: body.code,
        image_url: body.image_url,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
        is_active: body.is_active ?? true,
        min_order_amount: body.min_order_amount || 0,
        max_discount: body.max_discount,
      })
      .select()
      .single()

    if (error) {
      return createAdminError(error.message, 500)
    }

    return createAdminResponse({ promotion: data }, 201)
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// PUT update promotion
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return createAdminError('Promotion ID is required', 400)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createAdminError(error.message, 500)
    }

    return createAdminResponse({ promotion: data })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE promotion
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return createAdminError('Promotion ID is required', 400)
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id)

  if (error) {
    return createAdminError(error.message, 500)
  }

  return createAdminResponse({ message: 'Promotion deleted successfully' })
}
