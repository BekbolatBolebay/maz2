import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { createClient } from './supabase/server';

// SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// VAPID Configuration
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.SMTP_USER || 'admin@mazir.kz'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Sends an email notification.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Mazir App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('[Email] Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[Email] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a Web Push notification to a specific user subscription.
 */
export async function sendPushNotification(subscription: any, payload: { title: string; body: string; icon?: string; url?: string }) {
  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    console.log('[Push] Sent successfully');
    return { success: true, result };
  } catch (error: any) {
    console.error('[Push] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to notify admin via all enabled channels.
 */
export async function notifyAdminAllChannels(order: any, restaurant: any) {
  // 1. Email Notification
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const subject = `Новый заказ #${order.id.slice(0, 8)}`;
    const html = `
      <h1>Новый заказ!</h1>
      <p>Клиент: ${order.customer_name}</p>
      <p>Сумма: ${order.total_amount} ₸</p>
      <p>Тип: ${order.type}</p>
    `;
    await sendEmail({ to: restaurant.email || process.env.SMTP_USER, subject, html });
  }

  // 2. Push Notifications (for staff in staff_profiles)
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('push_subscription')
    .eq('cafe_id', restaurant.id)
    .not('push_subscription', 'is', null);

  if (staff && staff.length > 0) {
    const pushPayload = {
      title: 'Жаңа тапсырыс!',
      body: `${order.customer_name}-дан ${order.total_amount} ₸ сомасына тапсырыс түсті.`,
      icon: restaurant.image_url || '/icon-192x192.png',
      url: '/orders'
    };
    
    for (const member of staff) {
        if (member.push_subscription) {
            await sendPushNotification(member.push_subscription, pushPayload);
        }
    }
  }
}

/**
 * Notifies a specific customer.
 */
export async function notifyCustomer(userId: string, payload: { title: string; body: string; icon?: string; url?: string }) {
    const supabase = await createClient();
    
    // Try clients table
    let { data } = await supabase
        .from('clients')
        .select('push_subscription')
        .eq('id', userId)
        .single();
        
    if (!data?.push_subscription) {
        // Fallback to staff_profiles (if staff is the customer)
        const { data: staffData } = await supabase
            .from('staff_profiles')
            .select('push_subscription')
            .eq('id', userId)
            .single();
        data = staffData;
    }

    if (data?.push_subscription) {
        return await sendPushNotification(data.push_subscription, payload);
    }
    
    return { success: false, error: 'No subscription found' };
}
