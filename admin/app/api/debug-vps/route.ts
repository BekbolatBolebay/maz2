import { NextResponse } from 'next/server';
import { authenticateVPS } from '@/lib/vps';

export const dynamic = 'force-dynamic';

/**
 * VPS Diagnostic Route
 * Access at: /api/debug-vps
 */
export async function GET() {
    const email = process.env.VPS_ADMIN_EMAIL;
    const password = process.env.VPS_ADMIN_PASSWORD;
    const vpsUrl = process.env.NEXT_PUBLIC_VPS_URL;

    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            VPS_URL: {
                value: vpsUrl || 'NOT SET (Defaults to http://78.140.223.129:8090)',
                present: !!vpsUrl
            },
            VPS_EMAIL: {
                present: !!email,
                length: email ? email.length : 0,
                prefix: email ? `${email.substring(0, 3)}***` : 'N/A'
            },
            VPS_PASSWORD: {
                present: !!password,
                length: password ? password.length : 0
            }
        },
        connectivity: {
            status: 'Pending',
            error: null
        }
    };

    if (!email || !password) {
        diagnostics.connectivity.status = 'Skipped (Missing Credentials)';
        return NextResponse.json(diagnostics);
    }

    try {
        const pb = await authenticateVPS();
        if (pb.authStore.isValid && pb.authStore.isAdmin) {
            diagnostics.connectivity.status = 'Success (Authenticated as Admin)';
        } else {
            diagnostics.connectivity.status = 'Failed (Received client but not authenticated)';
        }
    } catch (err: any) {
        diagnostics.connectivity.status = 'Error';
        diagnostics.connectivity.error = err.message;
    }

    return NextResponse.json(diagnostics);
}
