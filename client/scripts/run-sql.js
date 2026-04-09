const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env to get connection string
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
lines.forEach(line => {
    const [key, ...value] = line.split('=');
    if (key) env[key.trim()] = value.join('=').trim();
});

const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;

if (!connectionString) {
    console.error('No connection string found in .env');
    process.exit(1);
}

const sqlPath = path.join(__dirname, '../../admin/scripts/fix-missing-columns.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');
        await client.query(sql);
        console.log('SQL executed successfully');
    } catch (err) {
        console.error('Execution error:', err);
    } finally {
        await client.end();
    }
}

run();
