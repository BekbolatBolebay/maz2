const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wuhefcbofaoqvsrejcjc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo'
);

async function testRealtime() {
  console.log('=== Supabase Realtime Test ===');
  console.log('Subscribing to orders table...');

  let receivedEvent = false;

  const channel = supabase
    .channel('test-realtime-orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
    }, (payload) => {
      console.log('\n✅ REALTIME EVENT RECEIVED!');
      console.log('  Event type:', payload.eventType);
      console.log('  Order ID:', payload.new?.id || payload.old?.id);
      console.log('  Status:', payload.new?.status);
      receivedEvent = true;
    })
    .subscribe((status, err) => {
      console.log('Channel status:', status);
      if (err) console.error('Channel error:', err);
      
      if (status === 'SUBSCRIBED') {
        console.log('\n✅ Successfully subscribed! Waiting for events...');
        console.log('Now triggering a test update...\n');
        
        // Trigger a test update on the most recent order
        triggerTestUpdate();
      }
    });

  async function triggerTestUpdate() {
    // Get the latest order
    const { data: orders, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, updated_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr || !orders || orders.length === 0) {
      console.log('❌ No orders found to test with:', fetchErr?.message);
      cleanup();
      return;
    }

    const order = orders[0];
    console.log(`Found order: ${order.id} (status: ${order.status})`);
    console.log('Updating updated_at to trigger realtime event...');

    // Just touch the updated_at field
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (updateErr) {
      console.log('❌ Update error:', updateErr.message);
      cleanup();
      return;
    }

    console.log('✅ Update sent. Waiting 5 seconds for realtime event...\n');

    // Wait 5 seconds for the event
    setTimeout(() => {
      if (!receivedEvent) {
        console.log('❌ NO REALTIME EVENT RECEIVED after 5 seconds!');
        console.log('\nPossible causes:');
        console.log('  1. RLS policies blocking realtime (most common)');
        console.log('  2. Realtime not enabled in Supabase Dashboard');
        console.log('  3. Network/WebSocket issues');
      }
      cleanup();
    }, 5000);
  }

  function cleanup() {
    supabase.removeChannel(channel);
    console.log('\nTest complete.');
    process.exit(0);
  }
}

testRealtime();
