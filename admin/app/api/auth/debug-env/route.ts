import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS,
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
    })
}
