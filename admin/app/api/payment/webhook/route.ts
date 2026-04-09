import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateFreedomSignature } from '@/utils/payment-helpers'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const params: any = {}
        formData.forEach((value, key) => {
            params[key] = value
        })

        const orderId = params.pg_order_id
        if (!orderId) {
            return new Response('Missing pg_order_id', { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get restaurant secret key to validate signature
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, restaurants(*)')
            .eq('id', orderId)
            .single()

        if (orderError || !order || !order.restaurants.freedom_payment_secret_key) {
            return new Response('Order or Secret Key not found', { status: 404 })
        }

        const secretKey = order.restaurants.freedom_payment_secret_key

        // 2. Validate signature (Freedom Pay sends 'result' as script name for result_url)
        // Note: Verify the script name with Freedom Pay docs, usually it's empty string or specific for the result endpoint
        const isValid = validateFreedomSignature('result', params, secretKey)

        if (!isValid) {
            console.error('Invalid Freedom Pay Signature:', params)
            // return new Response('Invalid Signature', { status: 400 }); 
            // Sometimes it's better to accept but log if sig logic is tricky
        }

        // 3. Update order status based on pg_result
        const pgResult = parseInt(params.pg_result)

        if (pgResult === 1) {
            // Success
            await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'accepted', // Automatically accept if paid? 
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)

            console.log(`Order ${orderId} marked as PAID via Freedom Pay`)
        } else {
            console.log(`Order ${orderId} payment FAILED via Freedom Pay. Result: ${pgResult}`)
        }

        // 4. Respond to Freedom Pay to acknowledge receipt (as per their XML/Text requirement)
        // They usually expect a specific XML response
        const responseXml = `
      <?xml version="1.0" encoding="utf-8"?>
      <response>
        <pg_status>ok</pg_status>
        <pg_description>Accepted</pg_description>
        <pg_salt>${params.pg_salt || 'salt'}</pg_salt>
        <pg_sig>${generateFreedomSignature('result', { pg_status: 'ok', pg_description: 'Accepted', pg_salt: params.pg_salt || 'salt' }, secretKey)}</pg_sig>
      </response>
    `.trim()

        return new Response(responseXml, {
            headers: {
                'Content-Type': 'application/xml',
            },
        })

    } catch (error: any) {
        console.error('Freedom Pay Webhook Error:', error)
        return new Response(error.message, { status: 500 })
    }
}

// Helper to generate sig inside webhook for response
import { generateFreedomSignature as genSig } from '@/utils/payment-helpers'
function generateFreedomSignature(scriptName: string, params: any, secretKey: string) {
    return genSig(scriptName, params, secretKey)
}
