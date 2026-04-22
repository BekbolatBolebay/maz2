import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyAdminAllChannels } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.INTERNAL_NOTIFICATION_SECRET;

    // 1. Authenticate the request
    if (!secret || authHeader !== `Bearer ${secret}`) {
      console.error('[Internal Notify] Unauthorized request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, reservationId, type = 'order' } = await req.json();
    const id = orderId || reservationId;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const table = type === 'booking' ? 'reservations' : 'orders';

    // 2. Fetch details with restaurant info
    const { data: record, error: dbError } = await supabase
      .from(table)
      .select('*, restaurants(*)')
      .eq('id', id)
      .single();

    if (dbError || !record) {
      console.error(`[Internal Notify] ${type} not found:`, dbError);
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }

    // 3. Trigger notifications
    console.log(`[Internal Notify] Triggering notifications for ${type}:`, id);
    await notifyAdminAllChannels(record, record.restaurants, type as any);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Internal Notify] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
