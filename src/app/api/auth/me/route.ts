import { NextResponse } from 'next/server';
import { getCurrentUser, comparePassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { university: true },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      studentVerified: user.studentVerified,
      phoneVerified: user.phoneVerified,
      allowPhoneCalls: user.allowPhoneCalls,
      university: user.university,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
  }

  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const dataToUpdate: any = {};

    // Şifre Değiştirme
    if (body.currentPassword || body.newPassword) {
      if (!body.currentPassword || !body.newPassword) {
        return NextResponse.json(
          { error: 'Mevcut şifre ve yeni şifre alanlarının her ikisi de doldurulmalıdır.' },
          { status: 400 }
        );
      }

      // Brute-force koruması: 15 dakikada en fazla 5 deneme
      const rateLimit = await checkRateLimit({
        key: `pw-change:${session.id}:${ip}`,
        limit: 5,
        windowSeconds: 900,
      });

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Çok fazla şifre değiştirme denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyiniz.' },
          { status: 429 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { passwordHash: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      }

      const isCurrentValid = await comparePassword(body.currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Mevcut şifreniz hatalı.' }, { status: 400 });
      }

      if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
        return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalıdır.' }, { status: 400 });
      }

      if (body.newPassword.length > 100) {
        return NextResponse.json({ error: 'Yeni şifre en fazla 100 karakter olabilir.' }, { status: 400 });
      }

      dataToUpdate.passwordHash = await hashPassword(body.newPassword);
    }

    if (typeof body.allowPhoneCalls === 'boolean') {
      dataToUpdate.allowPhoneCalls = body.allowPhoneCalls;
    }
    if (body.phone !== undefined) {
      if (body.phone === '' || body.phone === null) {
        dataToUpdate.phone = null;
      } else if (typeof body.phone === 'string') {
        const cleanPhone = body.phone.trim();
        const phoneRegex = /^(\+90|0)?[5][0-9]{9}$|^(\+?[0-9\s-]{10,15})$/;
        if (!phoneRegex.test(cleanPhone) || cleanPhone.length > 15) {
          return NextResponse.json(
            { error: 'Geçerli bir telefon numarası giriniz (Örn: 05321234567).' },
            { status: 400 }
          );
        }
        dataToUpdate.phone = cleanPhone;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Güncelleme yapılamadı' }, { status: 400 });
  }
}
