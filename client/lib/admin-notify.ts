/**
 * Utility to notify the Admin app about new orders
 * This bridges the gap between the Client (customer) and Admin (staff) projects.
 */
export async function triggerAdminNotification(orderId: string) {
  try {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://cafeadminis.mazirapp.kz';
    const secret = process.env.INTERNAL_NOTIFICATION_SECRET;

    if (!secret) {
      console.warn('[Admin Notify] Missing INTERNAL_NOTIFICATION_SECRET. Push notifications will not be sent.');
      return { success: false, error: 'Missing secret' };
    }

    console.log(`[Admin Notify] Triggering notification for order ${orderId} via ${adminUrl}`);

    const response = await fetch(`${adminUrl}/api/internal/notify-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Admin Notify] Failed to trigger notification: ${response.status}`, errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('[Admin Notify] Notification triggered successfully:', result);
    return { success: true, result };
  } catch (error: any) {
    console.error('[Admin Notify] Network error:', error);
    return { success: false, error: error.message };
  }
}
