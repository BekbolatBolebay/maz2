import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function verifyAdmin() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { authorized: false, user: null }
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  
  return { authorized: isAdmin, user }
}

export async function withAdminAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const { authorized, user } = await verifyAdmin()
    
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }
    
    return handler(req, user)
  }
}

export function createAdminResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function createAdminError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
