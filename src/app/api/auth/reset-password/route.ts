import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, removeAuthCookie } from '@/lib/auth';
import { z } from 'zod';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const resetPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.').transform((v) => v.toLowerCase().trim()),
  token: z.string().min(1, 'Sıfırlama kodu zorunludur.'),
  newPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.').max(100, 'Şifre en fazla 100 karakter olabilir.'),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Rate limiting: 5 attempts per 15 minutes per IP
    const rateLimit = await checkRateLimit({
      key: `reset-pw:${ip}`,
      limit: 5,
      windowSeconds: 900,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyiniz.' },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : {},
        }
      );
    }

    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, token, newPassword } = result.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.' },
        { status: 400 }
      );
    }

    // Verify token hash
    const inputHash = crypto.createHash('sha256').update(token).digest('hex');
    const isTokenValid = user.resetToken === inputHash || user.resetToken === token;

    if (!isTokenValid) {
      return NextResponse.json(
        { error: 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    // Update password, revoke reset token immediately, and unlock account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Invalidate existing sessions
    await removeAuthCookie();

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.',
    });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    return NextResponse.json(
      { error: 'Şifre sıfırlanırken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
