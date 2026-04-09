import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET all users
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')

  const supabase = await createClient()
  let query = supabase
    .from('staff_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query

  if (error) {
    return createAdminError(error.message, 500)
  }

  return createAdminResponse({ users: data })
}

// PUT update user role
export async function PUT(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const body = await req.json()
    const { id, role } = body

    if (!id || !role) {
      return createAdminError('User ID and role are required', 400)
    }

    const validRoles = ['user', 'admin']
    if (!validRoles.includes(role)) {
      return createAdminError('Invalid role', 400)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('staff_profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return createAdminError(error.message, 500)
    }

    return createAdminResponse({ user: data })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}

// DELETE user
export async function DELETE(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return createAdminError('User ID is required', 400)
    }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteError) {
      return createAdminError(deleteError.message, 500)
    }

    return createAdminResponse({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
