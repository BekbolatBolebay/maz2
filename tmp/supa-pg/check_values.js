const { Client } = require('pg');

const connectionString = "postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function checkValues() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const query = `
      SELECT id, name_ru, accept_kaspi, accept_freedom, accept_cash 
      FROM restaurants;
    `;
    const res = await client.query(query);
    console.log(res.rows);
    
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

checkValues();
