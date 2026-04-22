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
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.trim();
  const privKey = process.env.VAPID_PRIVATE_KEY.trim();

  try {
    webpush.setVapidDetails(vapidSubject, pubKey, privKey);
    console.log('[Push] VAPID configured successfully. Public key starts with:', pubKey.substring(0, 10));
  } catch (err) {
    console.error('[Push] Error setting VAPID details:', err);
  }
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
export async function sendPushNotification(user: { fcm_token?: string; push_subscription?: any }, payload: { title: string; body: string; icon?: string; url?: string; tag?: string }) {
  try {
    const pushPromises: Promise<any>[] = [];
    const notificationTag = payload.tag || `msg-${Date.now()}`;

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
            android: {
              priority: 'high',
              ttl: 3600 * 1000, // 1 hour
              notification: { 
                sound: 'default',
                channelId: 'fcm_default_channel',
                icon: 'ic_stat_name',
                color: '#FF5722',
                priority: 'max',
                visibility: 'public',
                vibrateTimingsMillis: [0, 500, 200, 500, 200, 500],
              }
            },
            data: {
              url: payload.url || '/',
              tag: notificationTag,
              order_id: (payload as any).order_id || ''
            },
            webpush: {
              fcm_options: { link: payload.url || '/' },
              headers: { Urgency: 'high' },
              notification: {
                icon: payload.icon || '/favicon-32x32.png',
                badge: '/icon-light-32x32.png',
                tag: notificationTag,
                vibrate: [500, 110, 500, 110, 450],
                requireInteraction: true,
                silent: false
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
        }
      } catch (e) {
        console.error('[Push] FCM error:', e);
      }
    }

    // 2. Standard Web-Push
    if (user.push_subscription) {
      pushPromises.push(
        webpush.sendNotification(
          user.push_subscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/',
            icon: payload.icon || '/favicon-32x32.png',
            tag: notificationTag
          }),
          { headers: { 'Urgency': 'high', 'TTL': '86400' } }
        ).catch((e: any) => {
          console.error('[Push] Web-Push error:', e?.message);
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
 * Sends a Telegram notification.
 */
export async function sendTelegramNotification(payload: { text: string, chat_id?: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = payload.chat_id || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[Telegram] Bot token or chat ID not configured. Skipping.');
    return { success: false, error: 'Not configured' };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: payload.text,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Unknown Telegram error');
    }

    console.log('[Telegram] Notification sent successfully to:', chatId);
    return { success: true };
  } catch (error: any) {
    console.error('[Telegram] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to notify admin via all enabled channels.
 */
export async function notifyAdminAllChannels(data: any, restaurant: any, type: 'order' | 'booking' = 'order') {
  const isOrder = type === 'order';
  const idPrefix = isOrder ? '#' : 'Res #';
  const idDisplay = data.id.slice(0, 8);
  const customerName = data.customer_name || 'Клиент';
  const adminUrl = 'https://cafeadminis.mazirapp.kz/orders';
  
  // 1. Email Notification
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const subject = isOrder 
        ? `Новый заказ #${idDisplay}` 
        : `Новое бронирование #${idDisplay}`;
    
    const html = isOrder ? `
      <h1>Новый заказ!</h1>
      <p>Клиент: ${customerName}</p>
      <p>Сумма: ${data.total_amount} ₸</p>
      <p>Тип: ${data.type}</p>
      <p><a href="${adminUrl}">Перейти в панель</a></p>
    ` : `
      <h1>Новое бронирование!</h1>
      <p>Клиент: ${customerName}</p>
      <p>Дата: ${data.date}</p>
      <p>Время: ${data.time}</p>
      <p>Гостей: ${data.guests_count}</p>
      <p><a href="${adminUrl}?tab=reservations">Перейти в панель</a></p>
    `;
    await sendEmail({ to: restaurant.email || process.env.SMTP_USER, subject, html });
  }

  // 2. Telegram Notification
  const telegramText = isOrder 
    ? `<b>🛍 ЖАҢА ТАПСЫРЫС ${idPrefix}${idDisplay}</b>\n\n` +
      `👤 Клиент: ${customerName}\n` +
      `💰 Сомасы: ${data.total_amount} ₸\n` +
      `📍 Ресторан: ${restaurant.name_ru || 'Mazir'}\n\n` +
      `<a href="${adminUrl}">👉 Панельге өту</a>`
    : `<b>📅 ЖАҢА БРОНДАУ ${idPrefix}${idDisplay}</b>\n\n` +
      `👤 Клиент: ${customerName}\n` +
      `📅 Күні: ${data.date}\n` +
      `⏰ Уақыты: ${data.time}\n` +
      `👥 Қонақтар: ${data.guests_count}\n\n` +
      `<a href="${adminUrl}?tab=reservations">👉 Панельге өту</a>`;
  
  // Use restaurant-specific Chat ID if available, otherwise global fallback
  await sendTelegramNotification({ 
      text: telegramText, 
      chat_id: restaurant.telegram_chat_id 
  });

  // 3. Push Notifications (for staff in staff_profiles)
  const supabase = await createClient();
  const { data: staff, error: staffError } = await supabase
    .from('staff_profiles')
    .select('role, fcm_token, push_subscription, full_name')
    .eq('cafe_id', restaurant.id);

  if (staffError) {
      console.error('[Notification] Error fetching staff:', staffError);
  }

  console.log(`[Notification] Found ${staff?.length || 0} staff members for cafe: ${restaurant.name_ru || restaurant.id}`);

  if (staff && staff.length > 0) {
    const pushPayload = {
      title: isOrder ? 'Жаңа тапсырыс!' : '📅 Жаңа брондау!',
      body: isOrder 
        ? `${customerName}-дан ${data.total_amount} ₸ сомасына тапсырыс түсті.`
        : `${customerName}-дан ${data.date} күніне, сағат ${data.time}-қа брондау түсті.`,
      icon: restaurant.image_url || '/icon-192x192.png',
      url: isOrder ? '/orders' : '/orders?tab=reservations'
    };
    
    // Notify everyone in the restaurant staff
    for (const member of staff) {
        console.log(`[Notification] Sending push to: ${member.full_name} (Has Token: ${!!member.fcm_token})`);
        const result = await sendPushNotification({ 
            fcm_token: member.fcm_token, 
            push_subscription: member.push_subscription 
        }, pushPayload);
        console.log(`[Notification] Result for ${member.full_name}:`, result.success ? '✅ Success' : `❌ Failed: ${result.error}`);
    }
  } else {
      console.warn('[Notification] No staff members found to notify');
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
