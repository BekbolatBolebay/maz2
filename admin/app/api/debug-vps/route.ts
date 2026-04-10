import { NextResponse } from 'next/server';
import { authenticateVPS } from '@/lib/vps';

export const dynamic = 'force-dynamic';

/**
 * VPS Diagnostic Route (Admin Upgrade V1.0.2)
 * Access at: /api/debug-vps
 */
export async function GET() {
    const email = process.env.VPS_ADMIN_EMAIL;
    const password = process.env.VPS_ADMIN_PASSWORD;
    const vpsUrl = process.env.NEXT_PUBLIC_VPS_URL;

    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        version: 'V1.0.2 - ADMIN_RESILIENCE_UPGRADE',
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            VPS_URL: {
                value: vpsUrl || 'NOT SET (Defaults to http://78.140.223.129:8090)',
                present: !!vpsUrl
            },
            VPS_EMAIL: {
                present: !!email,
                prefix: email ? `${email.substring(0, 3)}***` : 'N/A'
            },
            VPS_PASSWORD: {
                present: !!password,
                prefix: password ? `${password.substring(0, 3)}***` : 'N/A'
            }
        },
        connectivity: {
            status: 'Pending',
            adminAuth: 'Not Attempted',
            error: null
        }
    };

    try {
        const pb = await authenticateVPS();
        diagnostics.connectivity.vpsReachable = true;
        
        if (pb.authStore.isValid && pb.authStore.isAdmin) {
            diagnostics.connectivity.status = 'Success';
            diagnostics.connectivity.adminAuth = 'Authenticated (Admin SUCCESS)';
        } else {
            diagnostics.connectivity.status = 'Warning';
            diagnostics.connectivity.adminAuth = 'Connected but NOT Authenticated. Hard Fallback (ENV VARS) will be used.';
        }
    } catch (err: any) {
        diagnostics.connectivity.status = 'Error';
        diagnostics.connectivity.error = err.message;
    }

    return NextResponse.json(diagnostics);
}
