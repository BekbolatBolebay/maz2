import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFreedomSignature } from '@/utils/payment-helpers'

export async function POST(req: Request) {
    try {
        const { orderId, amount, description, customerEmail, customerPhone } = await req.json()

        if (!orderId || !amount) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get order and restaurant details to find merchant credentials
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, restaurants(*)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const restaurant = order.restaurants
        const merchantId = restaurant.freedom_merchant_id
        const secretKey = restaurant.freedom_payment_secret_key

        if (!merchantId || !secretKey) {
            return NextResponse.json({ error: 'Freedom Pay credentials not configured for this restaurant' }, { status: 400 })
        }

        // 2. Prepare Freedom Pay parameters
        const params: any = {
            pg_merchant_id: merchantId,
            pg_amount: amount,
            pg_currency: 'KZT',
            pg_order_id: orderId,
            pg_description: description || `Order #${orderId}`,
            pg_salt: Math.random().toString(36).substring(7),
            pg_language: 'ru',
            // Webhook and redirect URLs
            pg_result_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
            pg_success_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/orders/${orderId}?status=success`,
            pg_failure_url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/orders/${orderId}?status=failure`,
        }

        if (customerEmail) params.pg_user_contact_email = customerEmail
        if (customerPhone) params.pg_user_phone = customerPhone

        // 3. Generate signature
        const sig = generateFreedomSignature('init_payment.php', params, secretKey)
        params.pg_sig = sig

        // 4. Send request to Freedom Pay
        // Note: Freedom Pay often expects form-data or simple POST
        // Using formData here as it's common for init_payment.php
        const formData = new URLSearchParams()
        for (const key in params) {
            formData.append(key, params[key])
        }

        const response = await fetch('https://api.freedompay.kz/init_payment.php', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        const resultText = await response.text()

        // Freedom Pay response is often XML. We need to parse it or just look for the redirect URL.
        // Basic XML "parsing" for simplicity, or we could use an XML parser library
        const redirectUrlMatch = resultText.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/)
        const errorDescriptionMatch = resultText.match(/<pg_error_description>(.*?)<\/pg_error_description>/)

        if (redirectUrlMatch && redirectUrlMatch[1]) {
            return NextResponse.json({ redirectUrl: redirectUrlMatch[1] })
        } else {
            const errorMsg = errorDescriptionMatch ? errorDescriptionMatch[1] : 'Failed to get redirect URL'
            return NextResponse.json({ error: errorMsg, raw: resultText }, { status: 500 })
        }

    } catch (error: any) {
        console.error('Freedom Pay Init Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
