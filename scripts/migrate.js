const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:ppoHd9GwPwGUErIK@db.wuhefcbofaoqvsrejcjc.supabase.co:6543/postgres";

async function runMigrations() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Supabase DB');

        const sqlDir = path.join(__dirname, '../client/sql');
        const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            console.log(`Running ${file}...`);
            const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
            try {
                await client.query(sql);
                console.log(`Successfully applied ${file}`);
            } catch (err) {
                console.error(`Error in ${file}:`, err.message);
                // Continue with other files if some fail (e.g. table already exists)
            }
        }
    } catch (err) {
        console.error('Connection error:', err.message);
    } finally {
        await client.end();
    }
}

runMigrations();
