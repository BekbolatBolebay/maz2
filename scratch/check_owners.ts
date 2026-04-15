import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'client/.env' })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name_ru, owner_id')
  
  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('--- Restaurants ---')
  restaurants.forEach(r => {
    console.log(`${r.name_ru} (${r.id}): owner_id=${r.owner_id}`)
  })

  const { data: staff, error: staffError } = await supabase
    .from('staff_profiles')
    .select('id, full_name, email, role')
  
  if (staffError) {
    console.error('Staff Error:', staffError)
    return
  }

  console.log('\n--- Staff Profiles ---')
  staff.forEach(s => {
    console.log(`${s.full_name} (${s.id}): email=${s.email}, role=${s.role}`)
  })
}

check()
