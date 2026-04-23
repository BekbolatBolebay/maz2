import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Telegram Webhook] Received update:', JSON.stringify(body));

    // Handle /start command
    if (body.message?.text === '/start') {
      const chatId = body.message.chat.id;
      const url = new URL(req.url);
      const botToken = url.searchParams.get('token');
      
      if (botToken) {
        const welcomeMessage = `🌟 *Məzir App* жүйесіне қош келдіңіз!\n\n` +
          `Сіздің бұл чатпен байланысыңыз сәтті орнатылды.\n\n` +
          `🆔 Сіздің Chat ID: \`${chatId}\` \n\n` +
          `Осы санды көшіріп, мейрамхана баптауларындағы "Telegram Chat ID" бөліміне қойыңыз.`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeMessage,
            parse_mode: 'Markdown',
          }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
