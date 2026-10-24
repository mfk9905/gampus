import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUnreadMessagesCount } from '@/services/chat-service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const unreadCount = await getUnreadMessagesCount(user.id);
    return NextResponse.json({ unreadCount });
  } catch (error) {
    return NextResponse.json({ unreadCount: 0 });
  }
}

