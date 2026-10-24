type LogLevel = 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'resetToken',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
  'cardNumber',
];

/**
 * Recursively sanitizes objects to scrub passwords, tokens, and secrets from production logs.
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function formatLog(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const metaClean = meta ? sanitizeData(meta) : undefined;

  return {
    timestamp,
    level,
    message,
    ...(metaClean ? { meta: metaClean } : {}),
  };
}

export const logger = {
  info(message: string, meta?: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(formatLog('info', message, meta)));
    }
  },
  warn(message: string, meta?: any) {
    console.warn(JSON.stringify(formatLog('warn', message, meta)));
  },
  error(message: string, error?: any, meta?: any) {
    const errorData =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }
        : error;

    console.error(
      JSON.stringify(
        formatLog('error', message, {
          error: errorData,
          ...(meta ? sanitizeData(meta) : {}),
        })
      )
    );
  },
};

