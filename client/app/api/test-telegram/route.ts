import { NextResponse } from 'next/server';
import { notifyAdminTelegram } from '@/lib/actions';

export async function GET() {
    try {
        const testData = {
            id: 'TEST-' + Math.random().toString(36).substring(7).toUpperCase(),
            total_amount: 1000,
            items_count: 1,
            customer_name: 'Test User',
            customer_phone: '+7 777 777 7777',
            address: 'Almaty, Test St. 123'
        };

        const config = {
            name_ru: 'Test Restaurant',
            telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || '8787137858:AAGOad9s8JPdKmaPg4gw-i3Ls1I_Mz4tkXI',
            telegram_chat_id: process.env.TELEGRAM_CHAT_ID || '5328427875'
        };

        console.log('[Test] Sending telegram message...');
        
        // Use a simpler direct fetch to be sure
        const res = await fetch(`https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.telegram_chat_id,
                text: `🚀 *Мәзір Тест Хабарламасы*\nБәрі дұрыс істеп тұр!`,
                parse_mode: 'Markdown',
            }),
        });

        const result = await res.json();

        return NextResponse.json({
            success: result.ok,
            telegram_response: result,
            config_used: {
                chat_id: config.telegram_chat_id,
                token_preview: config.telegram_bot_token.substring(0, 10) + '...'
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        });
    }
}
