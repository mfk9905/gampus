import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { recordContactLead } from '@/services/listing-service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    const ip = getClientIp(req);

    // Rate limiting: 15 contact leads per minute per user/IP
    const rateLimit = await checkRateLimit({
      key: `lead:${session?.id || ip}`,
      limit: 15,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek yapıldı. Lütfen biraz bekleyiniz.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { listingId, contactType } = body;

    if (!listingId || !['MESSAGE', 'PHONE'].includes(contactType)) {
      return NextResponse.json({ error: 'Geçersiz parametreler.' }, { status: 400 });
    }

    const lead = await recordContactLead(listingId, contactType, session?.id);
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ error: 'İletişim istatistiği kaydedilemedi.' }, { status: 500 });
  }
}
