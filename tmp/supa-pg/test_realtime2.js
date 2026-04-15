const { createClient } = require('@supabase/supabase-js');

// Use anon key like the browser client does
const supabaseAnon = createClient(
  'https://wuhefcbofaoqvsrejcjc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTQwNTEsImV4cCI6MjA4Njk5MDA1MX0.Pgakyc30j_lERWopF8B5QwmOrA7nunLUKQvTaFOWtpA',
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Use service role key
const supabaseService = createClient(
  'https://wuhefcbofaoqvsrejcjc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo'
);

async function test() {
  console.log('=== Detailed Realtime Diagnostic ===\n');

  // 1. First check if we can query at all
  console.log('1. Testing basic connectivity...');
  const { data: testData, error: testErr } = await supabaseService
    .from('orders')
    .select('id, status')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (testErr) {
    console.log('❌ Cannot even query orders:', testErr.message);
    process.exit(1);
  }
  console.log('✅ DB query works. Latest order:', testData[0]?.id, 'status:', testData[0]?.status);

  // 2. Check RLS policies on orders
  console.log('\n2. Checking RLS policies on orders...');
  const { Client } = require('pg');
  const pgClient = new Client({
    connectionString: 'postgres://postgres.wuhefcbofaoqvsrejcjc:ppoHd9GwPwGUErIK@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    await pgClient.connect();
    
    // Check if RLS is enabled
    const rlsRes = await pgClient.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname IN ('orders', 'reservations', 'menu_items', 'categories')
      ORDER BY relname
    `);
    console.log('Table RLS status:');
    rlsRes.rows.forEach(r => {
      console.log(`  ${r.relname}: RLS enabled=${r.relrowsecurity}, forced=${r.relforcerowsecurity}`);
    });

    // Check RLS policies for SELECT on orders
    const policiesRes = await pgClient.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies 
      WHERE tablename IN ('orders', 'reservations')
      ORDER BY tablename, policyname
    `);
    console.log('\nRLS Policies:');
    policiesRes.rows.forEach(p => {
      console.log(`  ${p.tablename}.${p.policyname}: cmd=${p.cmd}, roles=${p.roles}, permissive=${p.permissive}`);
      if (p.qual) console.log(`    USING: ${p.qual.substring(0, 120)}`);
    });

    // Check if realtime extension is enabled
    const extRes = await pgClient.query(`
      SELECT * FROM pg_extension WHERE extname IN ('supabase_realtime', 'pgnet', 'pg_net')
    `);
    console.log('\nRealtime-related extensions:');
    if (extRes.rows.length === 0) console.log('  None found');
    extRes.rows.forEach(e => console.log(`  ${e.extname}: ${e.extversion}`));

    // Check walrus setting  
    const walRes = await pgClient.query(`SHOW wal_level`);
    console.log('\nWAL level:', walRes.rows[0]?.wal_level);

    await pgClient.end();
  } catch (err) {
    console.log('PG connection error:', err.message);
  }

  // 3. Try subscribing with timeout tracking
  console.log('\n3. Testing realtime subscription (10s timeout)...');
  
  let resolved = false;
  
  const channel = supabaseAnon
    .channel('diagnostic-test')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
    }, (payload) => {
      if (!resolved) {
        resolved = true;
        console.log('✅ REALTIME WORKS! Got event:', payload.eventType);
      }
    });

  // Track all status changes
  channel.subscribe((status, err) => {
    console.log(`  Channel status: ${status}`, err ? `Error: ${err.message}` : '');
    
    if (status === 'SUBSCRIBED' && !resolved) {
      console.log('  ✅ Subscribed! Triggering test update...');
      
      // Use service role to update
      supabaseService
        .from('orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testData[0].id)
        .then(({ error }) => {
          if (error) console.log('  ❌ Update failed:', error.message);
          else console.log('  ✅ Test update sent');
        });
    }
    
    if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
      console.log('\n❌ REALTIME FAILED:', status);
      console.log('\nDiagnosis:');
      console.log('  - WebSocket connection to Supabase Realtime server failed');
      console.log('  - This usually means Realtime is NOT enabled in Dashboard');
      console.log('  - Go to Supabase Dashboard → Database → Replication');
      console.log('  - Make sure "Realtime" is toggled ON for orders, reservations tables');
      console.log('  - Also check Project Settings → API → Realtime');
      if (!resolved) {
        resolved = true;
        setTimeout(() => process.exit(1), 1000);
      }
    }
  });

  // Timeout
  setTimeout(() => {
    if (!resolved) {
      console.log('\n❌ TIMEOUT: No realtime event received in 10 seconds');
      resolved = true;
      supabaseAnon.removeChannel(channel);
      process.exit(1);
    }
  }, 10000);
}

test();
