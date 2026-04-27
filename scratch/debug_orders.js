
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://wuhefcbofaoqvsrejcjc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getDefinition() {
  const { data, error } = await supabase.rpc('get_table_definition', { table_name: 'orders' });
  // If rpc doesn't exist, try querying information_schema
  if (error) {
    const { data: cols, error: colError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (colError) {
        console.error('Error fetching columns:', colError);
    } else {
        console.log('Columns in table:', Object.keys(cols[0] || {}));
    }
  } else {
    console.log('Definition:', data);
  }
}

async function checkRLS() {
    // Check if anon can insert
    const { error } = await supabase
        .from('orders')
        .insert({ cafe_id: 'dummy', customer_name: 'test', address: 'test' });
    console.log('Test Insert Error:', error);
}

getDefinition();
checkRLS();
