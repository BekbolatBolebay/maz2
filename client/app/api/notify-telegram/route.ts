import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { data, type, restaurantId } = body;

        // Hardcoded Fallback (same as our successful test)
        const HARDCODED_TOKEN = '8787137858:AAGOad9s8JPdKmaPg4gw-i3Ls1I_Mz4tkXI';
        const HARDCODED_CHAT_ID = '5328427875';

        const token = process.env.TELEGRAM_BOT_TOKEN || HARDCODED_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID || HARDCODED_CHAT_ID;

        const orderId = (data?.id || 'NEW').slice(0, 8);
        const title = type === 'order' ? '🔔 *Жаңа тапсырыс!*' : '📅 *Жаңа брондау!*';
        
        let message = `${title}\n\n`;
        message += `🆔 ID: #${orderId}\n`;
        
        if (type === 'order') {
            message += `💰 Сомасы: *${data?.total_amount || 0} ₸*\n`;
            message += `👤 Клиент: ${data?.customer_name || '---'}\n`;
            message += `📞 Тел: ${data?.customer_phone || '---'}\n`;
            if (data?.address) message += `🏠 Мекен-жай: ${data.address}\n`;
        } else {
            message += `📅 Күні: ${data?.date || '---'}\n`;
            message += `⏰ Уақыты: ${data?.time || '---'}\n`;
            message += `👤 Клиент: ${data?.customer_name || '---'}\n`;
        }

        message += `\n🔗 [Админ панель](https://cafeadminis.mazirapp.kz/orders)`;

        console.log(`[API-Notify] Sending to Telegram: ${chatId}`);

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        const result = await response.json();

        return NextResponse.json({ success: result.ok, result });
    } catch (error: any) {
        console.error('[API-Notify] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
