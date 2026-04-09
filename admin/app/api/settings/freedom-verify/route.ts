import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

function generateFreedomSignature(
    scriptName: string,
    params: Record<string, any>,
    secretKey: string
): string {
    const sortedKeys = Object.keys(params).sort()
    let signatureString = scriptName

    for (const key of sortedKeys) {
        const value = params[key]
        if (value === null || value === undefined) continue
        signatureString += ';' + String(value)
    }

    signatureString += ';' + secretKey
    return createHash('md5').update(signatureString).digest('hex')
}

export async function POST(req: Request) {
    try {
        const { merchantId, paymentKey } = await req.json()

        if (!merchantId || !paymentKey) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
        }

        // We use get_payment_status.php with a fake order ID to verify the signature
        const pg_params: any = {
            pg_merchant_id: merchantId,
            pg_order_id: 'verify-credentials-dummy',
            pg_salt: Math.random().toString(36).substring(7),
        }

        pg_params.pg_sig = generateFreedomSignature('get_payment_status.php', pg_params, paymentKey)

        const verifyUrl = `https://api.freedompay.kz/get_payment_status.php?${new URLSearchParams(pg_params).toString()}`

        const response = await fetch(verifyUrl)
        const text = await response.text()

        // If the signature is wrong, PayBox returns an error about the signature
        // If the signature is correct but the payment is not found (which is expected for a dummy ID), 
        // it means the credentials/key are valid.

        if (text.includes('Wrong signature') || text.includes('Signature is not correct')) {
            return NextResponse.json({
                success: false,
                error: 'Invalid Secret Key (Неверный секретный ключ)'
            })
        }

        // If it's another error but NOT a signature error, it usually means the key is correct 
        // but the merchant_id or the request itself had issues. 
        // However, "Payment not found" with a valid signature confirms the key is correct.

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Freedom verification error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
