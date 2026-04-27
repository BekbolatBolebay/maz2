const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://wuhefcbofaoqvsrejcjc.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    const { data, error } = await supabase
        .from('gift_certificates')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Columns:', Object.keys(data[0] || {}))
    }
}

checkColumns()
