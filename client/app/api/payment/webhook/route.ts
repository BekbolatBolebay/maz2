import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateFreedomSignature } from '@/utils/payment-helpers'
import { getMerchantConfig } from '@/lib/vps'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const params: Record<string, string> = {}

        formData.forEach((value, key) => {
            params[key] = value.toString()
        })

        const orderId = params.pg_order_id
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID missing' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get restaurant credentials to validate signature
        // We first check if it's an order, then if it's a reservation
        let targetTable: 'orders' | 'reservations' = 'orders'
        let entity: any = null

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, restaurants(*)')
            .eq('id', orderId)
            .single()

        if (order && !orderError) {
            entity = order
            targetTable = 'orders'
        } else {
            const { data: res, error: resError } = await supabase
                .from('reservations')
                .select('*, restaurants(*)')
                .eq('id', orderId)
                .single()

            if (res && !resError) {
                entity = res
                targetTable = 'reservations'
            }
        }

        if (!entity) {
            console.error('Payment Webhook - Entity not found for ID:', orderId)
            return NextResponse.json({ error: 'Order or Reservation not found' }, { status: 404 })
        }

        // 1b. Fetch Secure Merchant Config from VPS
        const vpsConfig = await getMerchantConfig(entity.restaurants.id);

        const secretKey = vpsConfig?.freedom_payment_secret_key || entity.restaurants.freedom_payment_secret_key || entity.restaurants.freedom_secret_key || process.env.FREEDOM_PAYMENT_SECRET_KEY
        if (!secretKey) {
            console.error('Payment Webhook - Merchant secret not found for entity:', orderId)
            return NextResponse.json({ error: 'Merchant secret not found' }, { status: 500 })
        }

        // 2. Validate signature
        // The script name for signature depends on your configuration, 
        // usually it's the filename or a fixed string like 'result'
        const isValid = validateFreedomSignature('webhook', params, secretKey)

        if (!isValid) {
            console.error('Signature validation failed for entity:', orderId)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // 3. Verify amount to prevent "underpayment" fraud
        const pgAmount = parseFloat(params.pg_amount)
        const expectedAmount = parseFloat(entity.total_amount)

        if (pgAmount < expectedAmount) {
            console.error('Amount mismatch for entity:', orderId, 'Expected:', expectedAmount, 'Received:', pgAmount)
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        // 4. Update status based on pg_result
        const isPaid = params.pg_result === '1'
        const paymentStatus = isPaid ? 'paid' : 'failed'

        const updates: any = {
            payment_status: paymentStatus,
            updated_at: new Date().toISOString()
        }

        if (isPaid) {
            if (targetTable === 'orders') {
                updates.status = 'preparing'
            } else {
                updates.status = 'confirmed'
            }
        }

        await supabase
            .from(targetTable)
            .update(updates)
            .eq('id', orderId)

        // 4. Respond to Freedom Pay (they expect XML response usually)
        return new Response(`
            <?xml version="1.0" encoding="utf-8"?>
            <response>
                <pg_status>ok</pg_status>
                <pg_description>Payment processed</pg_description>
                <pg_salt>${params.pg_salt || ''}</pg_salt>
                <pg_sig>${params.pg_sig || ''}</pg_sig>
            </response>
        `, {
            headers: { 'Content-Type': 'application/xml' }
        })

    } catch (error: any) {
        console.error('Freedom Pay Webhook Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
