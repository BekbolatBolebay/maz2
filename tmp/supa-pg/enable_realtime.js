const { Client } = require('pg');

const connectionString = "postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function enableRealtime() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to Supabase Postgres.");

    const query = `
      ALTER PUBLICATION supabase_realtime ADD TABLE 
        orders, 
        reservations, 
        reviews, 
        categories, 
        restaurants;
    `;
    
    await client.query(query);
    console.log("Successfully enabled Realtime for orders, reservations, reviews, categories, restaurants.");
    
  } catch (err) {
    if (err.message.includes("already in publication")) {
      console.log("Tables are already in publication.");
    } else {
      console.error("Error executing query:", err);
    }
  } finally {
    await client.end();
  }
}

enableRealtime();
