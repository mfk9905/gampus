import * as Sentry from '@sentry/nextjs';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const isSentryEnabled = Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN);

export function captureException(error: any, context?: Record<string, any>) {
  if (isSentryEnabled) {
    try {
      Sentry.captureException(error, {
        extra: context,
      });
    } catch (e) {
      logger.error('Sentry capture failed', e);
    }
  } else {
    logger.error('Application Exception Captured', error, context);
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (isSentryEnabled) {
    Sentry.captureMessage(message, level);
  } else {
    logger.info(`[Sentry Mock Message] ${message}`);
  }
}

