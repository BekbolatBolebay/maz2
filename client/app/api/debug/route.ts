import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const checks = {
            env: {
                SMTP_USER: !!process.env.SMTP_USER,
                SMTP_PASS: !!process.env.SMTP_PASS,
                SMTP_FROM: !!process.env.SMTP_FROM,
                SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            },
            database: {
                otp_codes_table: false,
                error: null as string | null
            }
        }

        // Check if otp_codes table exists and is readable
        const supabase = createAdminClient()
        const { error } = await (supabase.from('otp_codes') as any).select('id').limit(1)
        
        if (error) {
            checks.database.otp_codes_table = false
            checks.database.error = error.message
        } else {
            checks.database.otp_codes_table = true
        }

        return NextResponse.json({
            status: checks.database.otp_codes_table && Object.values(checks.env).every(v => v) ? 'OK' : 'ERROR',
            checks,
            version: '1.0.1-REINFORCED'
        })
    } catch (err: any) {
        return NextResponse.json({ 
            status: 'CRITICAL_ERROR',
            error: err.message
        }, { status: 500 })
    }
}
