import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const { data, type, restaurantId } = body;

    // Hardcoded Fallback (System Admin)
    const HARDCODED_TOKEN = '8787137858:AAGOad9s8JPdKmaPg4gw-i3Ls1I_Mz4tkXI';
    const HARDCODED_CHAT_ID = '5328427875';

    let token = process.env.TELEGRAM_BOT_TOKEN || HARDCODED_TOKEN;
    let chatId = process.env.TELEGRAM_CHAT_ID || HARDCODED_CHAT_ID;
    let restaurantName = 'Unknown';

    // Try to fetch specific restaurant settings
    if (restaurantId) {
        try {
            const supabase = await createClient();
            const { data: restaurant } = await supabase
                .from('restaurants')
                .select('telegram_bot_token, telegram_chat_id, name_ru')
                .eq('id', restaurantId)
                .single();

            if (restaurant) {
                if (restaurant.telegram_bot_token) token = restaurant.telegram_bot_token;
                if (restaurant.telegram_chat_id) chatId = restaurant.telegram_chat_id;
                restaurantName = restaurant.name_ru || 'Unknown';
            }
        } catch (dbError) {
            console.error('[API-Notify] Database error:', dbError);
        }
    }

    const orderId = (data?.id || 'NEW').slice(0, 8);
    const title = type === 'order' ? '🔔 *Жаңа тапсырыс!*' : type === 'certificate' ? '🎁 *Жаңа сертификат!*' : '📅 *Жаңа брондау!*';
    
    let message = `${title}\n\n`;
    message += `📍 Мейрамхана: ${restaurantName}\n`;
    message += `🆔 ID: #${orderId}\n`;
    
    if (type === 'order') {
        message += `💰 Сомасы: *${data?.total_amount || 0} ₸*\n`;
        message += `👤 Клиент: ${data?.customer_name || '---'}\n`;
        message += `📞 Тел: ${data?.customer_phone || '---'}\n`;
        if (data?.address) message += `🏠 Мекен-жай: ${data.address}\n`;
    } else if (type === 'certificate') {
        message += `💰 Сомасы: *${data?.total_amount || 0} ₸*\n`;
        message += `👤 Клиент: ${data?.customer_name || '---'}\n`;
        message += `📞 Тел: ${data?.customer_phone || '---'}\n`;
        message += `🎁 Сертификат сатып алынды\n`;
    } else {
        message += `📅 Күні: ${data?.date || '---'}\n`;
        message += `⏰ Уақыты: ${data?.time || '---'}\n`;
        message += `👤 Клиент: ${data?.customer_name || '---'}\n`;
    }

    message += `\n🔗 [Админ панель](https://cafeadminis.mazirapp.kz/orders)`;

    console.log(`[API-Notify] Sending to Telegram: ${chatId} (Bot: ${token.split(':')[0]})`);

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
            signal: AbortSignal.timeout(8000), // 8 second timeout
        });

        const result = await response.json();
        console.log(`[API-Notify] Telegram result:`, result.ok ? 'OK' : result.description);
        return NextResponse.json({ success: result.ok, result });
    } catch (error: any) {
        // Non-fatal: Telegram unreachable (network/dev env). Don't block the purchase flow.
        console.warn('[API-Notify] Telegram unreachable (non-fatal):', error.message);
        return NextResponse.json({ success: false, error: error.message, warning: 'Notification skipped' }, { status: 200 });
    }
}
