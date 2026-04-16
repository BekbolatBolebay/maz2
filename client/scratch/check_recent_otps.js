const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkOtpCodes() {
    const envPath = '/home/bekbolat/Жүктемелер/mazirapp-main/client/.env';
    if (!fs.existsSync(envPath)) {
        console.error('No .env found');
        return;
    }
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...v] = line.split('=');
        if (key && v.length) env[key.trim()] = v.join('=').trim().replace(/["']/g, '');
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Fetching last 5 OTP codes...');
    const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching OTP codes:', error);
    } else {
        console.log('Recent OTP codes:');
        console.log(JSON.stringify(data, null, 2));
    }
}

checkOtpCodes();
