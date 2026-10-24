import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getListings, createListing } from '@/services/listing-service';
import { createListingSchema } from '@/lib/validation';
import { ListingCategory, Condition, ListingStatus } from '@prisma/client';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await getCurrentUser();

    const category = searchParams.get('category') as ListingCategory | undefined;
    const universityId = searchParams.get('universityId') || undefined;
    const district = searchParams.get('district') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const condition = searchParams.get('condition') as Condition | undefined;
    const status = searchParams.get('status') as ListingStatus | undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'newest';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const listings = await getListings(
      {
        category,
        universityId,
        district,
        minPrice,
        maxPrice,
        condition,
        status,
        featured,
        search,
        sortBy,
        limit,
        offset,
      },
      session?.id
    );

    return NextResponse.json({ success: true, listings });
  } catch (error: any) {
    console.error('Get Listings Error:', error);
    return NextResponse.json({ error: 'İlanlar yüklenirken hata oluştu.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'İlan oluşturmak için giriş yapmalısınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `create-listing:${session.id}:${ip}`,
      limit: 10,
      windowSeconds: 600, // 10 listings per 10 mins
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla ilan oluşturma denemesi yapıldı. Lütfen biraz bekleyiniz.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = createListingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const newListing = await createListing(session.id, {
      ...result.data,
      universityId: result.data.universityId || session.universityId || undefined,
    });

    return NextResponse.json({
      success: true,
      listing: newListing,
      message: 'İlanınız başarıyla yayınlandı!',
    });
  } catch (error: any) {
    console.error('Create Listing Error:', error);
    return NextResponse.json({ error: 'İlan oluşturulurken bir hata oluştu.' }, { status: 500 });
  }
}
