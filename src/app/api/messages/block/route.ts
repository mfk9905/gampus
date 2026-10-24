import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { blockUser, unblockUser } from '@/services/chat-service';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const { blockedId, reason } = await req.json();
    if (!blockedId) {
      return NextResponse.json({ error: 'Engellenecek kullanıcı ID gereklidir.' }, { status: 400 });
    }

    const block = await blockUser(user.id, blockedId, reason);
    return NextResponse.json({ success: true, block });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Engelleme başarısız oldu' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
    }

    const { blockedId } = await req.json();
    if (!blockedId) {
      return NextResponse.json({ error: 'Kullanıcı ID gereklidir.' }, { status: 400 });
    }

    await unblockUser(user.id, blockedId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Engel kaldırılamadı' }, { status: 400 });
  }
}

