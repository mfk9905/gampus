import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';
import { env } from '@/lib/env';

const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.').transform((v) => v.toLowerCase().trim()),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Rate limiting: 5 requests per 15 minutes per IP
    const rateLimit = await checkRateLimit({
      key: `forgot-pw:${ip}`,
      limit: 5,
      windowSeconds: 900,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyin.' },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : {},
        }
      );
    }

    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    // Always respond with identical success message to prevent account enumeration
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry,
        },
      });

      const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

      // Send transactional reset email via Resend
      await sendPasswordResetEmail({
        to: email,
        name: user.name,
        resetUrl,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (Kayıtlı ise).',
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    return NextResponse.json(
      { error: 'İşlem gerçekleştirilemedi.' },
      { status: 500 }
    );
  }
}
