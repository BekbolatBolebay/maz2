
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wuhefcbofaoqvsrejcjc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo'

const tableName = process.argv[2] || 'restaurants'

async function checkSchema() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    return
  }
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)
  
  if (error) {
    console.error(`Error fetching ${tableName}:`, error)
  } else if (data && data.length > 0) {
    console.log(`Available columns in ${tableName} table:`, Object.keys(data[0]))
  } else {
    // Attempt to get column names even if table is empty (via rpc or just guessing from an insert)
    console.log(`No data in ${tableName} table to check columns via select. Attempting to get schema via an empty insert...`)
    const { data: cols, error: colError } = await supabase.from(tableName).insert({}).select()
    if (colError && colError.code === '42703') {
        // Column does not exist error might give us hints, but usually we just want column list
    }
  }
}

checkSchema()
