import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { loginSchema } from '@/lib/validation';
import { comparePassword, createToken, setAuthCookie } from '@/lib/auth';
import { checkLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Rate Limit & Account Lockout Check
    const rateLimit = await checkLoginRateLimit(ip, email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message, retryAfterSeconds: rateLimit.retryAfterSeconds },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : {},
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await recordLoginAttempt(ip, email, false);
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await recordLoginAttempt(ip, email, false);
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı.' },
        { status: 401 }
      );
    }

    // Success - reset attempts
    await recordLoginAttempt(ip, email, true);

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
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Giriş yapılırken bir hata oluştu.' }, { status: 500 });
  }
}

