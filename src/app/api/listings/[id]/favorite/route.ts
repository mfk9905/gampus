import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { toggleFavorite } from '@/services/listing-service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ error: 'Favorilere eklemek için giriş yapınız.' }, { status: 401 });
    }

    const rateLimit = await checkRateLimit({
      key: `fav:${session.id}`,
      limit: 60,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok hızlı işlem yapıyorsunuz. Lütfen biraz bekleyiniz.' }, { status: 429 });
    }

    const result = await toggleFavorite(session.id, id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: 'Favori işlemi başarısız.' }, { status: 500 });
  }
}
