import { NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/auth/admin';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const adminListingPatchSchema = z.object({
  featured: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'RENTED', 'PASSIVE']).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const result = adminListingPatchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { featured, status } = result.data;

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(featured !== undefined && { featured }),
        ...(status !== undefined && { status }),
      },
    });

    await logAdminAction(admin.id, 'UPDATE_LISTING_STATUS', 'LISTING', id, { featured, status });

    return NextResponse.json({ success: true, listing: updated });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'İlan güncellenemedi.' }, { status });
  }
}
