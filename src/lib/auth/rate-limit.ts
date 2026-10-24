import { prisma } from '@/lib/db/prisma';

export interface LoginRateLimitResult {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
}

/**
 * Multi-tiered Brute-Force Protection for Login (Phase 4).
 *
 * Tiered IP Protection:
 * - 5 failed attempts in past 1 min   -> 1 minute block (60s)
 * - 10 failed attempts in past 5 mins  -> 5 minute block (300s)
 * - 20 failed attempts in past 15 mins -> 15 minute block (900s)
 *
 * Account Protection:
 * - 5 consecutive failed attempts -> 5 minute temporary lockout
 *
 * User Enumeration Prevention:
 * Returns identical, generic rate limit error regardless of whether email exists or account is locked.
 */
export async function checkLoginRateLimit(ip: string, email: string): Promise<LoginRateLimitResult> {
  const now = new Date();

  // 1. Check Account-level temporary lock (if user exists)
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, lockedUntil: true, failedLoginAttempts: true },
  });

  if (user && user.lockedUntil && user.lockedUntil > now) {
    const diffSeconds = Math.max(1, Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000));
    return {
      allowed: false,
      message: 'Çok fazla başarısız giriş denemesi yapıldı. Güvenliğiniz için lütfen bir süre sonra tekrar deneyiniz.',
      retryAfterSeconds: diffSeconds,
    };
  }

  // 2. Tiered IP-based checks
  // Tier 1: 5 failures in past 1 min (60s)
  const oneMinAgo = new Date(now.getTime() - 60 * 1000);
  const failures1m = await prisma.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: oneMinAgo } },
  });
  if (failures1m >= 5) {
    return {
      allowed: false,
      message: 'Bu cihazdan çok sık başarısız deneme yapıldı. Lütfen 1 dakika sonra tekrar deneyiniz.',
      retryAfterSeconds: 60,
    };
  }

  // Tier 2: 10 failures in past 5 min (300s)
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const failures5m = await prisma.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: fiveMinsAgo } },
  });
  if (failures5m >= 10) {
    return {
      allowed: false,
      message: 'Çok fazla başarısız giriş denemesi algılandı. Lütfen 5 dakika sonra tekrar deneyiniz.',
      retryAfterSeconds: 300,
    };
  }

  // Tier 3: 20 failures in past 15 min (900s)
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const failures15m = await prisma.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: fifteenMinsAgo } },
  });
  if (failures15m >= 20) {
    return {
      allowed: false,
      message: 'Güvenlik nedeniyle erişiminiz 15 dakika süreyle durduruldu. Lütfen daha sonra tekrar deneyiniz.',
      retryAfterSeconds: 900,
    };
  }

  return { allowed: true };
}

/**
 * Record a login attempt outcome and adjust progressive lockouts.
 * Successful login resets account failed attempts and unlocks account.
 */
export async function recordLoginAttempt(ip: string, email: string, success: boolean): Promise<void> {
  const now = new Date();
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Record attempt history for IP tracking
  try {
    await prisma.loginAttempt.create({
      data: {
        ip,
        email: normalizedEmail,
        success,
      },
    });
  } catch (err) {
    // Non-blocking log
  }

  // 2. Adjust account lockout counters
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, failedLoginAttempts: true },
  });

  if (!user) return;

  if (success) {
    // Reset failed counter and clear any lockout on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLoginAt: null,
      },
    });
  } else {
    const newAttempts = user.failedLoginAttempts + 1;
    let lockedUntil: Date | null = null;

    // 5 consecutive failed attempts locks account for 5 minutes
    if (newAttempts >= 5) {
      lockedUntil = new Date(now.getTime() + 5 * 60 * 1000);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lastFailedLoginAt: now,
        lockedUntil,
      },
    });
  }
}
