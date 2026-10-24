import { NextResponse } from 'next/server';
import { getCurrentUser, createToken, setAuthCookie } from '@/lib/auth';
import {
  requestStudentVerificationOtp,
  confirmStudentVerificationOtp,
} from '@/services/user-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const body = await req.json().catch(() => ({}));

    // ADIM 2: KOD DOĞRULAMA (OTP VERIFY)
    if (body.otp) {
      const otpLimit = await checkRateLimit({
        key: `verify-otp:${session.id}:${ip}`,
        limit: 10,
        windowSeconds: 600, // 10 dakikada en fazla 10 kod denemesi (brute-force engelleme)
      });

      if (!otpLimit.allowed) {
        return NextResponse.json(
          { error: 'Çok fazla hatalı kod denendi. Lütfen 10 dakika sonra tekrar deneyiniz.' },
          { status: 429 }
        );
      }

      const result = await confirmStudentVerificationOtp(session.id, String(body.otp));

      // Oturum çerezini anında studentVerified: true olarak tazele
      const updatedToken = await createToken({
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
        studentVerified: true,
        universityId: session.universityId,
      });
      await setAuthCookie(updatedToken);

      return NextResponse.json(result);
    }

    // ADIM 1: KOD TALEP ETME (OTP REQUEST)
    const eduRateLimit = await checkRateLimit({
      key: `verify-edu:${session.id}:${ip}`,
      limit: 5,
      windowSeconds: 900, // 15 dakikada en fazla 5 kod talebi
    });

    if (!eduRateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla kod talep edildi. Lütfen bir süre sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    const { eduEmail } = body;
    if (!eduEmail || typeof eduEmail !== 'string' || !eduEmail.toLowerCase().trim().endsWith('.edu.tr')) {
      return NextResponse.json(
        { error: 'Lütfen geçerli bir .edu.tr uzantılı e-posta adresi giriniz.' },
        { status: 400 }
      );
    }

    const cleanEduEmail = eduEmail.toLowerCase().trim();
    const result = await requestStudentVerificationOtp(session.id, cleanEduEmail);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Doğrulama işlemi başarısız.' },
      { status: 400 }
    );
  }
}
