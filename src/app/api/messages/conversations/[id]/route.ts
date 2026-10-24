import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getConversationMessages, markConversationAsRead } from '@/services/chat-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Sohbet ID gereklidir.' }, { status: 400 });
    }

    const data = await getConversationMessages(id, user.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Conversation Detail GET Error]', error);
    return NextResponse.json({ error: error.message || 'Sohbet yüklenemedi' }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Sohbet ID gereklidir.' }, { status: 400 });
    }

    await markConversationAsRead(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Conversation Detail PATCH Error]', error);
    return NextResponse.json({ error: error.message || 'Okundu işaretlenemedi' }, { status: 400 });
  }
}

