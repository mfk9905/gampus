import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { reviewSchema } from '@/lib/validation';
import { calculateTrustScore } from '@/services/trust-score-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı ID zorunludur.' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { reviewedUserId: userId },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true, studentVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const trustScore = await calculateTrustScore(userId);

    return NextResponse.json({ reviews, trustScore });
  } catch (error) {
    return NextResponse.json({ error: 'Değerlendirmeler alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Lütfen önce giriş yapınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `review:${user.id}:${ip}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla değerlendirme yapıldı. Lütfen daha sonra tekrar deneyiniz.' }, { status: 429 });
    }

    const body = await req.json();
    const result = reviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { reviewedUserId, listingId, rating, communicationRating, accuracyRating, reliabilityRating, comment } = result.data;

    // Self-review prevention
    if (user.id === reviewedUserId) {
      return NextResponse.json({ error: 'Kendi profilinizi değerlendiremezsiniz.' }, { status: 400 });
    }

    // Interaction verification: users must have had at least one conversation to review
    const hasInteraction = await prisma.conversation.findFirst({
      where: {
        OR: [
          { buyerId: user.id, sellerId: reviewedUserId },
          { buyerId: reviewedUserId, sellerId: user.id },
        ],
      },
    });

    if (!hasInteraction) {
      return NextResponse.json(
        { error: 'Yalnızca mesajlaştığınız veya iletişime geçtiğiniz kullanıcıları değerlendirebilirsiniz.' },
        { status: 403 }
      );
    }

    // Review spam prevention: check if user already reviewed this recipient recently
    const existing = await prisma.review.findFirst({
      where: {
        reviewerId: user.id,
        reviewedUserId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h limit
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bu kullanıcıyı 24 saat içinde tekrar değerlendiremezsiniz.' },
        { status: 429 }
      );
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: user.id,
        reviewedUserId,
        listingId: listingId || null,
        rating,
        communicationRating,
        accuracyRating,
        reliabilityRating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: 'Değerlendirme kaydedilemedi.' }, { status: 500 });
  }
}
