const { Client } = require('pg');

const connectionString = "postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function checkRealtime() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const query = `
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime';
    `;
    const res = await client.query(query);
    console.log(res.rows.map(r => r.tablename));
    
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

checkRealtime();
