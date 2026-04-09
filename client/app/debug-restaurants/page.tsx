import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
    const supabase = await createClient()
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, name_ru, is_open, status, city, rating')
        .order('created_at', { ascending: false })
    
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug: All Restaurants (Latest First)</h1>
            {error && <pre className="text-red-500">{JSON.stringify(error, null, 2)}</pre>}
            <div className="space-y-2">
                {restaurants?.map(r => (
                    <div key={r.id} className="p-2 border rounded">
                        <p><strong>Name:</strong> {r.name_ru}</p>
                        <p><strong>ID:</strong> {r.id}</p>
                        <p><strong>Open:</strong> {String(r.is_open)}</p>
                        <p><strong>Status:</strong> {r.status}</p>
                        <p><strong>City:</strong> {r.city || 'null'}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
