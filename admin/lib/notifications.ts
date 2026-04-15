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
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:' + (process.env.SMTP_USER || 'admin@mazir.kz');
  webpush.setVapidDetails(
    vapidSubject,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[Push] VAPID keys not configured. Web-push notifications will not work.');
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
export async function sendPushNotification(user: { fcm_token?: string; push_subscription?: any }, payload: { title: string; body: string; icon?: string; url?: string }) {
  try {
    const pushPromises: Promise<any>[] = [];

    // 1. Firebase FCM (High priority)
    if (user.fcm_token) {
      console.log('[Push] Attempting FCM delivery for token:', user.fcm_token.slice(0, 10) + '...');
      try {
        const { messaging } = await import('./firebase-admin');
        if (messaging) {
          const message = {
            token: user.fcm_token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: {
              url: payload.url || '/',
            },
            webpush: {
              fcm_options: {
                link: payload.url || '/',
              },
              notification: {
                icon: payload.icon || '/favicon-32x32.png',
              }
            },
          };
          pushPromises.push(
            (messaging as any).send(message)
              .catch((e: any) => {
                console.error('[Push] FCM error:', e?.message);
                throw e;
              })
          );
        } else {
          console.warn('[Push] FCM messaging not initialized (missing credentials)');
        }
      } catch (e) {
        console.error('[Push] FCM processing error:', e);
      }
    }

    // 2. Standard Web-Push (Reliable fallback/complement)
    if (user.push_subscription) {
      console.log('[Push] Attempting Web-Push delivery for endpoint:', user.push_subscription.endpoint?.slice(0, 30) + '...');
      pushPromises.push(
        webpush.sendNotification(
          user.push_subscription,
          JSON.stringify(payload)
        ).catch((e: any) => {
          console.error('[Push] Web-Push error:', e?.statusCode, e?.body);
          throw e;
        })
      );
    }

    if (pushPromises.length === 0) {
      console.warn('[Push] No subscription or token found for user');
      return { success: false, error: 'No subscription or token found' };
    }

    const results = await Promise.allSettled(pushPromises);
    const failures = results.filter(r => r.status === 'rejected');
    
    if (failures.length > 0 && results.length === failures.length) {
      // All channels failed
      const errors = failures.map(f => (f as PromiseRejectedResult).reason?.message || 'Unknown error');
      console.error('[Push] All delivery channels failed:', errors);
      return { success: false, error: `Delivery failed: ${errors.join(', ')}` };
    }
    
    const successes = results.filter(r => r.status === 'fulfilled');
    console.log(`[Push] Delivered successfully via ${successes.length}/${results.length} channels`);
    return { success: true };
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
    .select('role, fcm_token, push_subscription, full_name')
    .eq('cafe_id', restaurant.id);

  if (staff && staff.length > 0) {
    const pushPayload = {
      title: 'Жаңа тапсырыс!',
      body: `${order.customer_name}-дан ${order.total_amount} ₸ сомасына тапсырыс түсті.`,
      icon: restaurant.image_url || '/icon-192x192.png',
      url: '/orders'
    };
    
    // Notify everyone in the restaurant staff
    for (const member of staff) {
        await sendPushNotification({ 
            fcm_token: member.fcm_token, 
            push_subscription: member.push_subscription 
        }, pushPayload);
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
        .select('fcm_token, push_subscription, push_token')
        .eq('id', userId)
        .single();
        
    if (!data?.fcm_token && !data?.push_subscription && !data?.push_token) {
        // Fallback to staff_profiles
        const { data: staffData } = await supabase
            .from('staff_profiles')
            .select('fcm_token, push_subscription, push_token')
            .eq('id', userId)
            .single();
        data = staffData as any;
    }

    if (data) {
        // Use either native push_subscription or the stringified push_token
        const subscription = data.push_subscription || (data.push_token ? JSON.parse(data.push_token) : null);
        
        if (data.fcm_token || subscription) {
            return await sendPushNotification({ 
                fcm_token: data.fcm_token, 
                push_subscription: subscription 
            }, payload);
        }
    }
    
    return { success: false, error: 'No subscription or token found' };
}
