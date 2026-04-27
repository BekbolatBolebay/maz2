import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFreedomSignature } from '@/utils/payment-helpers'
import { getMerchantConfig } from '@/lib/vps'

export async function POST(req: Request) {
    try {
        const { orderId, reservationId, certificateId, amount, description, customerEmail, customerPhone } = await req.json()

        if ((!orderId && !reservationId && !certificateId) || !amount) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        const user = session?.user

        console.log('Payment Init Debug - Session:', session ? 'Found' : 'Missing')
        if (authError) console.error('Payment Init Debug - Auth Error:', authError)

        let restaurant: any = null
        let record: any = null
        const isReservation = !!reservationId
        const isCertificate = !!certificateId
        let finalId = orderId || reservationId || certificateId

        // 1. Get order/reservation/certificate and restaurant details
        if (orderId) {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('*, restaurants!cafe_id(*), order_items(*)')
                .eq('id', orderId)
                .single()

            if (orderError) {
                console.error('Payment Init - Order Query Error:', orderError)
                return NextResponse.json({ error: 'Order not found', orderId }, { status: 404 })
            }
            record = order
            restaurant = order.restaurants
            restaurant.items = order.order_items
        } else if (reservationId) {
            const { data: res, error: resError } = await supabase
                .from('reservations')
                .select('*, restaurants!cafe_id(*), reservation_items(*)')
                .eq('id', reservationId)
                .single()

            if (resError) {
                console.error('Payment Init - Reservation Query Error:', resError)
                return NextResponse.json({ error: 'Reservation not found', reservationId }, { status: 404 })
            }
            record = res
            restaurant = res.restaurants
            restaurant.items = res.reservation_items
        } else if (certificateId) {
            const { data: cert, error: certError } = await supabase
                .from('gift_certificates')
                .select('*, restaurants:cafe_id(*)')
                .eq('id', certificateId)
                .single()

            if (certError) {
                console.error('Payment Init - Certificate Query Error:', certError)
                return NextResponse.json({ error: 'Certificate not found', certificateId }, { status: 404 })
            }
            record = cert
            restaurant = cert.restaurants
            // Certificates don't have items for receipt, but we can pass the certificate itself
            restaurant.items = [{ name: 'Подарочный сертификат', quantity: 1, price: cert.initial_amount }]
        }

        if (!restaurant && !isCertificate) {
            return NextResponse.json({ error: 'Restaurant details not found' }, { status: 500 })
        }

        // 1b. Fetch Secure Merchant Config from VPS
        // If it's a global certificate (no cafe_id), we might need global credentials
        const vpsConfig = restaurant ? await getMerchantConfig(restaurant.id) : null;
        
        const merchantId = vpsConfig?.freedom_merchant_id || restaurant.freedom_merchant_id || process.env.FREEDOM_MERCHANT_ID || process.env.NEXT_PUBLIC_FREEDOM_MERCHANT_ID;
        const secretKey = vpsConfig?.freedom_payment_secret_key || restaurant.freedom_payment_secret_key || restaurant.freedom_secret_key || process.env.FREEDOM_PAYMENT_SECRET_KEY || process.env.FREEDOM_SECRET_KEY;
        // Fixed to production mode as requested by user
        const isTestMode = false; 
        
        // Try to get public URL from headers if env is missing
        const host = req.headers.get('host')
        const protocol = req.headers.get('x-forwarded-proto') || 'http'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`

        console.log(`[Payment] Init: Restaurant=${restaurant.id}, Mode=${isTestMode ? 'TEST' : 'PRODUCTION'}, Flags=[VPS:${!!vpsConfig?.freedom_test_mode}, DB:${!!restaurant.freedom_test_mode}], URL=${appUrl}`)

        console.log(`Payment Init - Credential Sources for Restaurant [${restaurant.id}]:`, {
            vps: vpsConfig ? 'Config Found in VPS' : 'No VPS Config',
            merchantSource: vpsConfig?.freedom_merchant_id ? 'VPS' : (restaurant.id ? 'Restaurant ID present' : 'N/A')
        });

        console.log('Payment Init Debug - Merchant ID:', merchantId ? 'Present' : 'MISSING')
        console.log('Payment Init Debug - Secret Key:', secretKey ? 'Present' : 'MISSING')

        // MOCK MODE: If credentials are missing, allow testing via a mock redirect
        if (!merchantId || !secretKey) {
            console.warn('⚠️ Freedom Pay credentials missing. Redirecting to MOCK CARD for demo/testing purposes.');

            // Generate a mock card entry URL
            const mockCardUrl = `/checkout/mock-card?${orderId ? `orderId=${orderId}` : `reservationId=${reservationId}`}&amount=${amount}`;

            return NextResponse.json({
                redirectUrl: mockCardUrl,
                isMock: true,
                message: 'Demo/Testing mode: Please configure Freedom Pay credentials in Admin Panel for real payments.'
            })
        }

        // 2. Prepare Freedom Pay parameters
        const params: any = {
            pg_merchant_id: merchantId,
            pg_amount: record.total_amount,
            pg_currency: 'KZT',
            pg_order_id: finalId, // Use either orderId or reservationId
            pg_description: description || `Payment for #${finalId.slice(0, 8)}`,
            pg_salt: Math.random().toString(36).substring(7),
            pg_language: 'ru',
            pg_testing_mode: isTestMode ? 1 : 0, 
            // Webhook and redirect URLs
            pg_result_url: `${appUrl}/api/payment/webhook`,
            pg_success_url: `${appUrl}/${isReservation ? 'reservations' : (isCertificate ? 'certificates' : 'orders')}/${isCertificate ? '' : finalId}${isCertificate ? `?id=${finalId}&status=success` : '?status=success'}`,
            pg_failure_url: `${appUrl}/${isReservation ? 'reservations' : (isCertificate ? 'certificates' : 'orders')}/${isCertificate ? '' : finalId}${isCertificate ? `?id=${finalId}&status=failure` : '?status=failure'}`,
        }

        // Add Fiscalization Data if items and receipt key are available
        if (restaurant.items && restaurant.items.length > 0) {
            const receiptData = restaurant.items.map((item: any) => ({
                name: item.name_ru || item.name_kk || 'Item',
                count: item.quantity || 1,
                price: item.price,
                type: 'service',
                vat_percent: 0,
                // Optional: tax_type could be added if needed
            }))

            // For delivery orders, add delivery fee as an item if it exists
            if (orderId && restaurant.delivery_fee > 0) {
                receiptData.push({
                    name: 'Доставка',
                    count: 1,
                    price: restaurant.delivery_fee,
                    type: 'service',
                    vat_percent: 0
                })
            }

            // Important: Use pg_receipt_positions as per modern docs, stringify for signature and transmission
            params.pg_receipt_positions = JSON.stringify(receiptData)
        }

        if (customerEmail) params.pg_user_contact_email = customerEmail
        if (customerPhone) params.pg_user_phone = String(customerPhone).replace(/\D/g, '')

        // 3. Generate signature
        const sig = generateFreedomSignature('init_payment.php', params, secretKey)
        params.pg_sig = sig

        console.log('Payment Init Debug - Final Params (without sig):', params)

        // 4. Send request to Freedom Pay
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

        if (!response.ok) {
            console.error('Freedom Pay API Network Error:', response.status, response.statusText)
            return NextResponse.json({ 
                error: `Freedom Pay API Connectivity Error: ${response.statusText}`,
                status: response.status 
            }, { status: 502 })
        }

        const resultText = await response.text()
        console.log('Freedom Pay API Raw Response:', resultText)

        const redirectUrlMatch = resultText.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/)
        const errorDescriptionMatch = resultText.match(/<pg_error_description>(.*?)<\/pg_error_description>/)
        const errorCodeMatch = resultText.match(/<pg_error_code>(.*?)<\/pg_error_code>/)

        if (redirectUrlMatch && redirectUrlMatch[1]) {
            const redirectUrl = redirectUrlMatch[1]

            // 5. Save payment URL to DB for persistence
            if (orderId) {
                await supabase
                    .from('orders')
                    .update({ payment_url: redirectUrl })
                    .eq('id', orderId)
            } else if (reservationId) {
                await supabase
                    .from('reservations')
                    .update({ payment_url: redirectUrl })
                    .eq('id', reservationId)
            } else if (certificateId) {
                await supabase
                    .from('gift_certificates')
                    .update({ payment_url: redirectUrl })
                    .eq('id', certificateId)
            }

            return NextResponse.json({ redirectUrl })
        } else {
            const errorMsg = errorDescriptionMatch ? errorDescriptionMatch[1] : 'Failed to get redirect URL'
            const errorCode = errorCodeMatch ? errorCodeMatch[1] : 'unknown'
            console.error('Freedom Pay Init Failed:', { errorCode, errorMsg })
            
            return NextResponse.json({ 
                error: errorMsg, 
                errorCode,
                raw: resultText 
            }, { status: 400 })
        }

    } catch (error: any) {
        console.error('Freedom Pay Init Exception:', error)
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error during payment initialization'
        }, { status: 500 })
    }
}
