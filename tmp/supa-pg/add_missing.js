const { Client } = require('pg');

const connectionString = "postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

async function addMissingTables() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const query = `
      ALTER PUBLICATION supabase_realtime ADD TABLE reviews, categories;
    `;
    await client.query(query);
    console.log("Successfully added reviews and categories to supabase_realtime.");
    
  } catch (err) {
    if (err.message.includes("already member")) {
      console.log("Tables already in publication.");
    } else {
      console.error("Error executing query:", err);
    }
  } finally {
    await client.end();
  }
}

addMissingTables();
