import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables!')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkImages() {
    console.log('--- Checking Restaurants ---')
    const { data: restaurants, error: resError } = await supabase
        .from('restaurants')
        .select('id, name_ru, image_url, banner_url')
        .limit(5)

    if (resError) console.error('Error fetching restaurants:', resError)
    else {
        restaurants.forEach(r => {
            console.log(`Restaurant: ${r.name_ru} (${r.id})`)
            console.log(`  image_url: ${r.image_url}`)
            console.log(`  banner_url: ${r.banner_url}`)
        })
    }

    console.log('\n--- Checking Menu Items ---')
    const { data: items, error: itemError } = await supabase
        .from('menu_items')
        .select('id, name_ru, image_url')
        .limit(5)

    if (itemError) console.error('Error fetching menu items:', itemError)
    else {
        items.forEach(i => {
            console.log(`Item: ${i.name_ru} (${i.id})`)
            console.log(`  image_url: ${i.image_url}`)
        })
    }
}

checkImages()
