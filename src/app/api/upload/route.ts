import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates actual binary magic bytes to prevent renamed executables or SVG/XSS payloads.
 */
function isValidImageBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: RIFF ... WEBP (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Görsel yüklemek için giriş yapmalısınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `upload:${user.id}:${ip}`,
      limit: 25,
      windowSeconds: 600, // 25 uploads per 10 mins
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla görsel yükleme denemesi yapıldı. Lütfen biraz bekleyiniz.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Yüklenecek dosya seçilmedi.' }, { status: 400 });
    }

    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu çok büyük. Maksimum 5 MB yüklenebilir.' },
        { status: 400 }
      );
    }

    // 2. Check declared MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Yalnızca JPG, PNG ve WebP formatında fotoğraflar yüklenebilir.' },
        { status: 400 }
      );
    }

    // 3. Read buffer and verify magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageBytes(buffer)) {
      return NextResponse.json(
        { error: 'Geçersiz veya bozuk görsel dosyası.' },
        { status: 400 }
      );
    }

    // 4. Upload to Cloudinary
    const result = await uploadImageToCloudinary(buffer);

    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || 'Görsel yüklenemedi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: any) {
    console.error('[Upload Route Error]', error);
    return NextResponse.json(
      { error: 'Dosya işlenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

