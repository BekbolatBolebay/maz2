
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://wuhefcbofaoqvsrejcjc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const { data, error } = await supabase.from('orders').insert({
    cafe_id: '462788e3-0c46-4977-9ca6-8058728f3234', // Assuming this is the restaurant ID for "1234"
    customer_name: 'Test Customer',
    customer_phone: '77777777777',
    customer_avatar: '',
    status: 'new',
    total_amount: 1000,
    type: 'certificate',
    payment_method: 'pending',
    payment_status: 'pending',
    phone: '77777777777'
  }).select().single();

  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
