const { Client } = require('pg');
require('dotenv').config();

async function setup() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        await client.query(`
      CREATE TABLE IF NOT EXISTS public.otp_codes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS otp_codes_email_idx ON public.otp_codes(email);

      -- Cleanup old codes
      DELETE FROM public.otp_codes WHERE expires_at < NOW();
    `);

        console.log('Database setup complete');
    } catch (err) {
        console.error('Setup error:', err);
    } finally {
        await client.end();
    }
}

setup();
获得
