const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/home/bekbolat/Жүктемелер/mazirapp-main/client/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
  const { error } = await supabase.from('otp_codes').select('id').limit(1);
  if (error) {
    console.log('Error or missing table:', error.message);
  } else {
    console.log('Table otp_codes exists!');
  }
}

checkTable();
