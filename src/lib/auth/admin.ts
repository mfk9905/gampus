import { getCurrentUser, UserSessionPayload } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

/**
 * Server-side authorization check for ADMIN endpoints.
 * Throws an AuthError if not authenticated (401) or not an ADMIN (403).
 */
export async function requireAdmin(): Promise<UserSessionPayload> {
  const session = await getCurrentUser();
  if (!session) {
    throw new AuthError('Bu işlem için giriş yapmalısınız.', 401);
  }

  // Database verification: Ensure user still exists and actively holds ADMIN role in DB
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, role: true, lockedUntil: true },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    throw new AuthError('Bu işlem için yönetici yetkisi gereklidir.', 403);
  }

  if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
    throw new AuthError('Hesabınız askıya alınmıştır.', 403);
  }

  return session;
}

/**
 * Audit log recording for sensitive administrative actions.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: targetId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error('[Admin Audit Log Error]', err);
  }
}

