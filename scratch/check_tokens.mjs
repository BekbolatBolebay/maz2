import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkTokens() {
  console.log('Checking staff_profiles for FCM tokens...')
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, full_name, fcm_token, cafe_id')
    
  if (error) {
    console.error('Error fetching staff_profiles:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No staff profiles found.')
    return
  }

  console.table(data.map(s => ({
    name: s.full_name,
    has_token: !!s.fcm_token,
    token_start: s.fcm_token ? s.fcm_token.substring(0, 10) + '...' : 'NONE',
    cafe: s.cafe_id
  })))
}

checkTokens()
