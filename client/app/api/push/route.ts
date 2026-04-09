import { NextResponse } from 'next/server'
import webpush from 'web-push'

// These should ideally be in .env
// const vapidKeys = webpush.generateVAPIDKeys()
// console.log(vapidKeys)

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@yourdomain.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    )
}

export async function POST(req: Request) {
    try {
        const { subscription, payload } = await req.json()

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription is required' }, { status: 400 })
        }

        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        )

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Push notification error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
