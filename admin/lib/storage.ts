import { createClient } from './supabase/server'

/**
 * Uploads a file to Supabase Storage
 * @param file The file object to upload
 * @param path The destination path in the bucket (e.g. 'cafe-id/filename.jpg')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, path: string) {
    const supabase = await createClient()
    const bucketName = 'mazir'

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
            upsert: true,
            contentType: file.type
        })

    if (error) {
        console.error('Supabase Storage Upload Error:', error)
        throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

    return publicUrl
}
