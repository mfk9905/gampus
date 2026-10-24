import { Resend } from 'resend';
import { env } from '@/lib/env';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const fromEmail = env.EMAIL_FROM || 'UNILIVE <noreply@unilive.app>';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Reusable email service supporting transactional emails via Resend.
 * Gracefully falls back in development if RESEND_API_KEY is not configured.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  if (!resendClient) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EMAIL NOTICE - DEV MOCK] Email to: ${to} | Subject: "${subject}" (Resend API key not configured)`);
    }
    return { success: true, messageId: 'mock-dev-id' };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('[Resend Exception]', err);
    return { success: false, error: err.message || 'E-posta gönderilemedi.' };
  }
}

/**
 * Sends a password reset email with a secure link.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<SendEmailResult> {
  const subject = 'UNILIVE — Şifre Sıfırlama Talebi';
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 20px; font-weight: 800; color: #0d9488; text-transform: uppercase; margin-bottom: 24px; letter-spacing: -0.5px; }
        h1 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 16px 0; }
        .btn { display: inline-block; background-color: #0d9488; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 12px; margin: 16px 0; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">UNILIVE</div>
        <h1>Şifre Sıfırlama Talebi</h1>
        <p>Merhaba ${name || 'Öğrenci'},</p>
        <p>UNILIVE hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="btn" target="_blank">Şifremi Sıfırla</a>
        </div>
        <p>Bu bağlantı <strong>15 dakika</strong> boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız; hesabınız güvendedir.</p>
        <div class="footer">
          UNILIVE Üniversite Kampüs Yaşamı &bull; Bu otomatik bir bildirimdir.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
}

/**
 * Sends a student verification confirmation email.
 */
export async function sendStudentVerifiedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<SendEmailResult> {
  const subject = 'UNILIVE — Öğrenci Rozetiniz Onaylandı! 🟢';
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 20px; font-weight: 800; color: #0d9488; text-transform: uppercase; margin-bottom: 24px; }
        h1 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 16px 0; }
        .badge { display: inline-block; background-color: #ccfbf1; color: #115e59; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 999px; margin-bottom: 12px; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">UNILIVE</div>
        <div class="badge">🟢 Doğrulandı</div>
        <h1>Öğrenci Doğrulamanız Tamamlandı!</h1>
        <p>Tebrikler ${name},</p>
        <p>Üniversite e-postanız (.edu.tr) başarıyla doğrulandı. Profilinize ve ilanlarınıza <strong>Doğrulanmış Öğrenci</strong> rozeti eklendi.</p>
        <p>Artık kampüs içi ev arkadaşı ararken veya 2. el eşya alım-satımında diğer öğrencilere tam güven sağlayabilirsiniz.</p>
        <div class="footer">
          UNILIVE &bull; Üniversite Topluluğu Güven Sistemi
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
}

/**
 * Sends a 6-digit verification code (OTP) for .edu.tr student badge verification.
 */
export async function sendStudentOtpEmail({
  to,
  name,
  otp,
}: {
  to: string;
  name: string;
  otp: string;
}): Promise<SendEmailResult> {
  const subject = `UNILIVE — Öğrenci Doğrulama Kodunuz: ${otp}`;
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 20px; font-weight: 800; color: #0d9488; text-transform: uppercase; margin-bottom: 24px; }
        h1 { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 16px 0; }
        .code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0d9488; background: #f0fdfa; border: 2px dashed #99f6e4; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">UNILIVE</div>
        <h1>Öğrenci Rozeti Doğrulama Kodu</h1>
        <p>Merhaba ${name || 'Öğrenci'},</p>
        <p>UNILIVE hesabınıza <strong>Doğrulanmış Öğrenci Rozeti</strong> tanımlamak için tek kullanımlık doğrulama kodunuz:</p>
        <div class="code">${otp}</div>
        <p>Bu kod <strong>10 dakika</strong> süreyle geçerlidir. Eğer bu işlemi siz talep etmediyseniz lütfen bu e-postayı dikkate almayınız.</p>
        <div class="footer">
          UNILIVE &bull; Üniversite Kampüs Yaşamı Güven Sistemi
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to, subject, html });
}

