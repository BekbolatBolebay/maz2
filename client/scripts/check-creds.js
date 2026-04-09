
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return {};

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });
    return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.log('Env loaded keys:', Object.keys(env));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreds() {
    const { data, error } = await supabase
        .from('restaurants')
        .select('id, name_ru, freedom_merchant_id, freedom_secret_key');

    if (error) {
        console.error('Error fetching restaurants:', error);
        return;
    }

    console.log('--- Restaurant Credentials ---');
    data.forEach(r => {
        console.log(`ID: ${r.id}`);
        console.log(`Name: ${r.name_ru}`);
        console.log(`Merchant ID: ${r.freedom_merchant_id ? 'SET (' + r.freedom_merchant_id + ')' : 'MISSING'}`);
        console.log(`Secret Key: ${r.freedom_secret_key ? 'SET' : 'MISSING'}`);
        console.log('------------------------------');
    });
}

checkCreds();
