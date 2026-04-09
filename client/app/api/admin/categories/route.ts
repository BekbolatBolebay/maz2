import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all global categories (cafe_id is null)
export async function GET(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('cafe_id', null)
        .order('sort_order', { ascending: true })

    if (error) {
        return createAdminError(error.message, 500)
    }

    return createAdminResponse({ categories: data })
}

// POST create global category
export async function POST(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    try {
        const body = await req.json()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('categories')
            .insert({
                name_kk: body.name_kk,
                name_ru: body.name_ru,
                name_en: body.name_en || body.name_ru,
                icon_url: body.icon_url || '',
                sort_order: body.sort_order || 0,
                is_active: body.is_active ?? true,
                cafe_id: null
            })
            .select()
            .single()

        if (error) {
            return createAdminError(error.message, 500)
        }

        return createAdminResponse({ category: data }, 201)
    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}

// PUT update category
export async function PUT(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    try {
        const body = await req.json()
        const { id, ...updates } = body

        if (!id) {
            return createAdminError('Category ID is required', 400)
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return createAdminError(error.message, 500)
        }

        return createAdminResponse({ category: data })
    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}

// DELETE category
export async function DELETE(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return createAdminError('Category ID is required', 400)
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

    if (error) {
        return createAdminError(error.message, 500)
    }

    return createAdminResponse({ message: 'Category deleted successfully' })
}
