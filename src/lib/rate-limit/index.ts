import { prisma } from '@/lib/db/prisma';

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remaining?: number;
}

/**
 * Serverless-safe, database-backed rate limiter.
 * Operates across all Vercel function instances without needing external Redis.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = options;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    // 1. Count attempts in current window
    const currentCount = await prisma.rateLimitAttempt.count({
      where: {
        key,
        createdAt: { gte: windowStart },
      },
    });

    if (currentCount >= limit) {
      // Find oldest attempt in current window to calculate exact retryAfter
      const oldestInWindow = await prisma.rateLimitAttempt.findFirst({
        where: { key, createdAt: { gte: windowStart } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });

      const elapsed = oldestInWindow
        ? Math.floor((now.getTime() - oldestInWindow.createdAt.getTime()) / 1000)
        : 0;
      const retryAfterSeconds = Math.max(1, windowSeconds - elapsed);

      return {
        allowed: false,
        retryAfterSeconds,
        remaining: 0,
      };
    }

    // 2. Record this attempt
    await prisma.rateLimitAttempt.create({
      data: { key, createdAt: now },
    });

    // 3. Lightweight cleanup: Probabilistically clean up older attempts (1 in 20 requests)
    if (Math.random() < 0.05) {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      prisma.rateLimitAttempt
        .deleteMany({
          where: { createdAt: { lt: oneHourAgo } },
        })
        .catch(() => {});
    }

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
    };
  } catch (error) {
    // If DB has temporary issue, fail open to prevent blocking legitimate users, but log
    console.error('[RateLimit Error]', error);
    return { allowed: true };
  }
}

/**
 * Extracts the real client IP behind Cloudflare / Vercel proxy.
 * Cloudflare's 'cf-connecting-ip' header is the most authoritative when behind Cloudflare.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first && first.length > 0) {
      return first;
    }
  }

  return '127.0.0.1';
}

