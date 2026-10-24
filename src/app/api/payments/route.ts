import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processPremiumPayment } from '@/services/payment-service';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Ödeme yapmak için giriş yapmalısınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `payment:${user.id}:${ip}`,
      limit: 10,
      windowSeconds: 900,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla ödeme denemesi yapıldı. Lütfen daha sonra tekrar deneyiniz.' }, { status: 429 });
    }

    const body = await req.json();
    const { listingId, durationDays } = body;

    if (!listingId || !durationDays) {
      return NextResponse.json({ error: 'İlan ID ve paket süresi zorunludur.' }, { status: 400 });
    }

    // Verify listing ownership
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.userId !== user.id) {
      return NextResponse.json({ error: 'İlan bulunamadı veya işlem yetkiniz yok.' }, { status: 403 });
    }

    const result = await processPremiumPayment({
      userId: user.id,
      listingId,
      durationDays: Number(durationDays),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '🚀 İlanınız başarıyla ÖNE ÇIKARILDI!',
      payment: result.payment,
      premiumUntil: result.premiumUntil,
    });
  } catch (error) {
    console.error('Payment Error:', error);
    return NextResponse.json({ error: 'Ödeme işlenirken bir hata oluştu.' }, { status: 500 });
  }
}
