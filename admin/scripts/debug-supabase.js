require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Testing with URL:', supabaseUrl);
    console.log('Service Key (first 10 chars):', supabaseServiceKey?.substring(0, 10));

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing environment variables');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log('Testing select from restaurants...');
        const { data, error } = await supabase.from('restaurants').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('Select Error:', error);
        } else {
            console.log('Select Success, count:', data);
        }

        console.log('Testing auth.admin.listUsers...');
        const { data: users, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Auth Error:', authError);
        } else {
            console.log('Auth Success, users found:', users.users.length);
        }
    } catch (e) {
        console.error('Unexpected exception:', e);
    }
}

testConnection();
