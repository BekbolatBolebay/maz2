const { Client } = require('pg');

const connectionString = "postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function addColumns() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    
    const query = `
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS kaspi_link text,
      ADD COLUMN IF NOT EXISTS freedom_merchant_id text,
      ADD COLUMN IF NOT EXISTS freedom_payment_secret_key text,
      ADD COLUMN IF NOT EXISTS freedom_receipt_secret_key text,
      ADD COLUMN IF NOT EXISTS freedom_test_mode boolean DEFAULT false;
    `;
    
    await client.query(query);
    console.log("Successfully added columns to restaurants table.");
    
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await client.end();
  }
}

addColumns();
