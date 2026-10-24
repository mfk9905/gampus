import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendMessage } from '@/services/chat-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `msg:${user.id}:${ip}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok hızlı mesaj gönderiyorsunuz. Lütfen biraz bekleyiniz.' }, { status: 429 });
    }

    const { conversationId, text } = await req.json();

    if (!conversationId || !text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Sohbet ve mesaj metni zorunludur.' }, { status: 400 });
    }

    if (text.trim().length > 1000) {
      return NextResponse.json({ error: 'Mesajınız çok uzun. En fazla 1.000 karakter gönderebilirsiniz.' }, { status: 400 });
    }

    const message = await sendMessage(conversationId, user.id, text);
    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('[Send Message POST Error]', error);
    // Return friendly validation / error message with status 400
    return NextResponse.json(
      { error: error.message || 'Mesaj gönderilemedi.' },
      { status: 400 }
    );
  }
}

