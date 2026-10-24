import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, type: { not: 'CHAT_MESSAGE' } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false, type: { not: 'CHAT_MESSAGE' } },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: 'Bildirimler alınamadı.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit({
      key: `notif:patch:${user.id}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla istek yapıldı. Lütfen bekleyiniz.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (notificationId) {
      // IDOR check
      const notif = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      if (!notif || notif.userId !== user.id) {
        return NextResponse.json({ error: 'Bildirim bulunamadı.' }, { status: 403 });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Bildirim güncellenemedi.' }, { status: 500 });
  }
}
