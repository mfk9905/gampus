import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { registerSchema } from '@/lib/validation';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `register:${ip}`,
      limit: 5,
      windowSeconds: 900, // 5 registrations per 15 mins
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyiniz.' },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : {},
        }
      );
    }
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone, universityId } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile zaten kayıtlı bir kullanıcı var.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const isEduEmail = email.endsWith('.edu.tr');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        universityId: universityId || null,
        studentVerified: false, // .edu.tr olsa bile OTP doğrulaması zorunludur
        pendingEduEmail: isEduEmail ? email : null,
        phoneVerified: !!phone,
      },
    });

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentVerified: user.studentVerified,
      universityId: user.universityId,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentVerified: user.studentVerified,
        phoneVerified: user.phoneVerified,
      },
      message: isEduEmail
        ? 'Kayıt başarılı! Öğrenci rozetinizi profilinizden .edu.tr e-posta onay kodu ile anında aktif edebilirsiniz.'
        : 'Kayıt başarılı.',
    });
  } catch (error: any) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: 'Kayıt sırasında bir hata oluştu.' }, { status: 500 });
  }
}
