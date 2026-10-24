import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunludur.'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET en az 16 karakter olmalıdır.')
    .refine(
      (val) => {
        if (!isProduction) return true;
        const disallowed = [
          'secret',
          '123456',
          'development-secret',
          'unilive_super_secret_jwt_key_2026_dev_mode',
          'unilive_fallback_secret_key_2026'
        ];
        return !disallowed.includes(val) && val.length >= 32;
      },
      {
        message:
          'Üretim (production) ortamında tahmin edilebilir veya yetersiz uzunlukta JWT_SECRET kullanılamaz. En az 32 karakterlik güvenli bir anahtar belirleyin.',
      }
    ),
  NEXT_PUBLIC_APP_URL: z.string().min(1, 'NEXT_PUBLIC_APP_URL zorunludur.').default('http://localhost:3000'),

  // Resend Email (Opsiyonel / Üretimde e-posta gönderimi için gereklidir)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default('UNILIVE <noreply@unilive.app>'),

  // Cloudinary Image Storage (Opsiyonel / Üretimde görsel yükleme için gereklidir)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Sentry (Opsiyonel)
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

  // Pusher Realtime (Opsiyonel - Tanımlı değilse polling fallback çalışır)
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional().default('eu'),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional().default('eu'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Geçersiz ortam değişkenleri (Environment Variables):');
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    if (isProduction) {
      throw new Error('Üretim ortamında kritik ortam değişkenleri eksik veya geçersiz. Dağıtım durduruldu.');
    }
  }
  return result.success ? result.data : (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();

