import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        console.log('[Track Order Complete] Attempting to complete order with token:', token)

        // Update order status directly where tracking token matches
        // We use select() to verify that something was actually updated
        const { data: updatedOrders, error: updateError } = await supabase
            .from('orders')
            .update({ 
                status: 'delivered', 
                updated_at: new Date().toISOString()
            })
            .eq('courier_tracking_token', token)
            .select('id, order_number, status')

        if (updateError) {
            console.error('[Track Order Complete] Update Error:', updateError)
            return NextResponse.json({ 
                error: 'Тапсырыс күйін жаңарту мүмкін болмады', 
                details: updateError.message,
                code: updateError.code 
            }, { status: 500 })
        }

        if (!updatedOrders || updatedOrders.length === 0) {
            console.warn('[Track Order Complete] No order found with token:', token)
            return NextResponse.json({ error: 'Тапсырыс табылмады немесе сілтеме қате' }, { status: 404 })
        }

        console.log('[Track Order Complete] Success for Order:', updatedOrders[0].order_number)
        return NextResponse.json({ success: true, order: updatedOrders[0] })
    } catch (error: any) {
        console.error('[Track Order Complete] Unexpected Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
