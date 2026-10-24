import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { reportConversation } from '@/services/chat-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `report-conv:${user.id}:${ip}`,
      limit: 10,
      windowSeconds: 900, // 10 reports per 15 mins
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla şikayet gönderildi. Lütfen daha sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    const { conversationId, reason, description } = await req.json();
    if (!conversationId || !reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'Sohbet ve şikayet nedeni zorunludur.' }, { status: 400 });
    }

    if (reason.length > 100) {
      return NextResponse.json({ error: 'Şikayet nedeni en fazla 100 karakter olabilir.' }, { status: 400 });
    }

    if (description && typeof description === 'string' && description.length > 1000) {
      return NextResponse.json({ error: 'Açıklama en fazla 1.000 karakter olabilir.' }, { status: 400 });
    }

    const report = await reportConversation(user.id, conversationId, reason.trim(), description ? description.trim() : undefined);
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Şikayet iletilemedi' }, { status: 400 });
  }
}

