import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Fetch order by tracking token bypassing RLS
        const { data: order, error } = await supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('courier_tracking_token', token)
            .single()

        if (error || !order) {
            console.error('[Track Order Details] Error:', error)
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('[Track Order Details] Unexpected Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
