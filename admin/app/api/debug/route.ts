import { NextResponse } from 'next/server'
import { authenticateVPS } from '@/lib/vps'

export async function GET() {
    try {
        const checks = {
            env: {
                VPS_ADMIN_EMAIL: !!process.env.VPS_ADMIN_EMAIL,
                VPS_ADMIN_PASSWORD: !!process.env.VPS_ADMIN_PASSWORD,
                NEXT_PUBLIC_VPS_URL: process.env.NEXT_PUBLIC_VPS_URL || 'DEFAULT',
                SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            },
            vps_connection: {
                status: 'UNKNOWN',
                error: null as string | null
            }
        }

        // Check if VPS is reachable and auth works
        try {
            const pb = await authenticateVPS();
            if (pb.authStore.isValid && pb.authStore.isAdmin) {
                checks.vps_connection.status = 'AUTHENTICATED'
            } else {
                checks.vps_connection.status = 'UNAUTHENTICATED'
                checks.vps_connection.error = 'Credentials provided but auth failed'
            }
        } catch (vpsErr: any) {
            checks.vps_connection.status = 'CONNECTION_FAILED'
            checks.vps_connection.error = vpsErr.message
        }

        return NextResponse.json({
            status: checks.vps_connection.status === 'AUTHENTICATED' && checks.env.VPS_ADMIN_EMAIL ? 'OK' : 'ERROR',
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
