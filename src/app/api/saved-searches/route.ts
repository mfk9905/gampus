import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { savedSearchSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ savedSearches });
  } catch (error) {
    return NextResponse.json({ error: 'Aramalar getirilemedi.' }, { status: 500 });
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
      key: `saved-search:${user.id}:${ip}`,
      limit: 15,
      windowSeconds: 300,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla kayıt yapıldı. Lütfen biraz bekleyiniz.' }, { status: 429 });
    }

    const body = await req.json();
    const result = savedSearchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    // Limit maximum saved searches per user to 15
    const userSearchCount = await prisma.savedSearch.count({
      where: { userId: user.id },
    });

    if (userSearchCount >= 15) {
      return NextResponse.json(
        { error: 'Maksimum kayıtlı arama sınırına (15) ulaştınız. Yeni eklemek için eskilerden birini siliniz.' },
        { status: 400 }
      );
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: user.id,
        name: result.data.name,
        category: result.data.category || null,
        universityId: result.data.universityId || null,
        district: result.data.district || null,
        minPrice: result.data.minPrice || null,
        maxPrice: result.data.maxPrice || null,
        condition: result.data.condition || null,
      },
    });

    return NextResponse.json({ success: true, savedSearch });
  } catch (error) {
    console.error('Save search error:', error);
    return NextResponse.json({ error: 'Arama kaydedilemedi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Arama ID zorunludur.' }, { status: 400 });
    }

    // Ensure user owns this saved search (IDOR protection)
    const existing = await prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Arama bulunamadı veya silme yetkiniz yok.' }, { status: 403 });
    }

    await prisma.savedSearch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Arama silinemedi.' }, { status: 500 });
  }
}
