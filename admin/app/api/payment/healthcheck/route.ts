import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Freedom Pay healthcheck requires HTTP/2 or HTTP/3
        // fetch in Node.js/Next.js supports HTTP/2 where available
        const response = await fetch('https://api.freedompay.kz/status/healthcheck', {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.text()
            return NextResponse.json({ status: 'ok', data })
        } else {
            return NextResponse.json({ status: 'error', code: response.status }, { status: 502 })
        }
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
    }
}
