import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/storage'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Кафе ID-ін алу (папка құрылымы үшін)
        const { data: cafe } = await supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        const cafeId = cafe?.id || 'unknown'
        const timestamp = Date.now()
        const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const key = `${cafeId}/${timestamp}-${fileName}`

        console.log('--- Uploading to Supabase Storage ---')
        const url = await uploadFile(file, key)
        console.log('Upload Success:', url)

        return NextResponse.json({ url })
    } catch (error: any) {
        console.error('Upload Route Error Detail:', {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack
        })
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
