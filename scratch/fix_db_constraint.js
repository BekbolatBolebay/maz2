
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const connectionString = "postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function fixConstraint() {
  const client = new Client({ 
    connectionString
  });
  try {
    await client.connect();
    console.log('Connected to DB');
    
    await client.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_type_check');
    await client.query("ALTER TABLE orders ADD CONSTRAINT orders_type_check CHECK (type IN ('delivery', 'pickup', 'booking', 'certificate'))");
    
    console.log('Constraint updated successfully');
  } catch (err) {
    console.error('Error updating constraint:', err);
  } finally {
    await client.end();
  }
}

fixConstraint();
