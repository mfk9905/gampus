import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserConversations, getOrCreateConversation } from '@/services/chat-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const conversations = await getUserConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('[Conversations GET Error]', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `create-conv:${user.id}:${ip}`,
      limit: 20,
      windowSeconds: 600, // 20 conversations per 10 mins
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla sohbet başlatma denemesi yapıldı. Lütfen biraz bekleyiniz.' },
        { status: 429 }
      );
    }

    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: 'İlan ID gereklidir.' }, { status: 400 });
    }

    const conversation = await getOrCreateConversation(listingId, user.id);
    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error('[Conversations POST Error]', error);
    return NextResponse.json({ error: error.message || 'Sohbet başlatılamadı' }, { status: 400 });
  }
}

