import { NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/auth/admin';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  userId: z.string().min(1, 'Kullanıcı ID zorunludur.'),
  studentVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isBanned: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          studentVerified: true,
          phoneVerified: true,
          allowPhoneCalls: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
          university: {
            select: { id: true, name: true, shortName: true },
          },
          _count: {
            select: { listings: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Kullanıcılar yüklenemedi.' }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { userId, studentVerified, phoneVerified, role, isBanned } = result.data;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(studentVerified !== undefined && { studentVerified }),
        ...(phoneVerified !== undefined && { phoneVerified }),
        ...(role !== undefined && { role }),
        ...(isBanned !== undefined && {
          lockedUntil: isBanned ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : null,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentVerified: true,
        phoneVerified: true,
        lockedUntil: true,
      },
    });

    await logAdminAction(admin.id, isBanned !== undefined ? (isBanned ? 'BAN_USER' : 'UNBAN_USER') : 'UPDATE_USER_PERMISSIONS', 'USER', userId, {
      studentVerified,
      phoneVerified,
      role,
      isBanned,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Kullanıcı güncellenemedi.' }, { status });
  }
}
