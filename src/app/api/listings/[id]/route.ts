import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getListingById, updateListingStatus, updateListing } from '@/services/listing-service';
import { prisma } from '@/lib/db/prisma';
import { updateStatusSchema, updateListingSchema } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { deleteCloudinaryImage } from '@/lib/cloudinary';
import { logAdminAction } from '@/lib/auth/admin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    const listing = await getListingById(id, session?.id);

    if (!listing) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, listing });
  } catch (error: any) {
    return NextResponse.json({ error: 'İlan getirilirken hata oluştu.' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `listing:patch:${session.id}:${ip}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla istek yapıldı. Lütfen bekleyiniz.' }, { status: 429 });
    }

    const body = await req.json();
    const result = updateStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const updated = await updateListingStatus(id, session.id, result.data.status);
    return NextResponse.json({ success: true, listing: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'İlan güncellenemedi.' }, { status: 400 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Yetkisiz erişim. Lütfen giriş yapınız.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `listing:put:${session.id}:${ip}`,
      limit: 20,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Çok fazla istek yapıldı. Lütfen biraz bekleyiniz.' }, { status: 429 });
    }

    const body = await req.json();
    const result = updateListingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const isAdmin = session.role === 'ADMIN';
    const updated = await updateListing(id, session.id, result.data, isAdmin);

    if (isAdmin && updated.userId !== session.id) {
      await logAdminAction(session.id, 'UPDATE_LISTING', 'Listing', id, { updatedFields: Object.keys(result.data) });
    }

    return NextResponse.json({ success: true, listing: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'İlan güncellenemedi.' }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'İlan bulunamadı.' }, { status: 404 });
    }

    // Ownership & Authorization check (IDOR protection)
    const isOwner = listing.userId === session.id;
    const isAdmin = session.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Bu ilanı silme yetkiniz yok.' }, { status: 403 });
    }

    // Clean up images in Cloudinary
    if (listing.images && listing.images.length > 0) {
      await Promise.all(
        listing.images.map((img) => deleteCloudinaryImage(img.url))
      ).catch(() => {});
    }

    // Delete listing record (cascading takes care of relations)
    await prisma.listing.delete({ where: { id } });

    if (isAdmin && !isOwner) {
      await logAdminAction(session.id, 'DELETE_LISTING', 'LISTING', id, { title: listing.title });
    }

    return NextResponse.json({ success: true, message: 'İlan başarıyla silindi.' });
  } catch (error: any) {
    console.error('[Delete Listing Error]', error);
    return NextResponse.json({ error: 'İlan silinemedi.' }, { status: 500 });
  }
}
