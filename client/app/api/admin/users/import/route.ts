import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

export async function POST(req: NextRequest) {
    const { authorized } = await verifyAdmin()
    if (!authorized) {
        return createAdminError('Unauthorized', 403)
    }

    try {
        const body = await req.json()
        const { clients } = body

        if (!clients || !Array.isArray(clients)) {
            return createAdminError('Invalid clients data', 400)
        }

        const supabase = await createClient()

        // We import into public.clients. 
        // Note: These users won't be able to log in until they are created in auth.users
        // but they will exist in the database for management/history.

        let successCount = 0
        const errors = []

        for (const client of clients) {
            const { email, full_name, phone } = client

            if (!email) {
                errors.push(`Missing email for client: ${full_name || 'Unknown'}`)
                continue
            }

            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('clients')
                .select('id')
                .eq('email', email)
                .single()

            if (existingUser) {
                // Update existing user info if needed
                const { error: updateError } = await supabase
                    .from('clients')
                    .update({
                        full_name: full_name || undefined,
                        phone: phone || undefined,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', email)

                if (!updateError) successCount++
                else errors.push(`Error updating ${email}: ${updateError.message}`)
            } else {
                // Since we don't have a UUID from auth.users (they haven't signed up yet),
                // we might need a workaround or just skip for now if the schema requires a valid auth.users reference.
                // Looking at the schema: "id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE"

                // IMPORTANT: In this specific schema, we CANNOT insert into public.clients directly without a corresponding auth.users(id).
                // So for "Import", we have two options:
                // 1. Just store them in a temporary table or a new "leads/clients" table.
                // 2. We can't insert into public.users directly.

                errors.push(`Client ${email} skipped: Users must register via Auth first, or schema needs modification to support placeholder users.`)
            }
        }

        return createAdminResponse({
            success: true,
            count: successCount,
            total: clients.length,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error: any) {
        return createAdminError(error.message, 500)
    }
}
