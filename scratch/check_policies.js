
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const connectionString = "postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

async function checkPolicies() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT * FROM pg_policies WHERE tablename = 'orders'");
    console.log('Policies count:', res.rows.length);
    res.rows.forEach(p => console.log(`Policy: ${p.policyname}, Cmd: ${p.cmd}, Roles: ${p.roles}`));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
checkPolicies();
