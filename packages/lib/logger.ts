/**
 * Production-safe logging utility
 *
 * Features:
 * - Different log levels (debug, info, warn, error)
 * - Only logs debug info in development
 * - Sanitizes sensitive data in production
 * - Formats logs consistently
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Patterns to detect sensitive data
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /auth/i,
  /credential/i,
  /bearer/i,
];

/**
 * Check if a key contains sensitive information
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Sanitize sensitive data from objects
 */
function sanitizeData(data: unknown): unknown {
  if (typeof data === 'string') {
    // Don't log long strings that might contain sensitive data
    if (data.length > 500) {
      return `[String: ${data.length} chars]`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format log message with context
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: LogContext
): string {
  const timestamp = getTimestamp();
  const levelUpper = level.toUpperCase().padEnd(5);

  let formatted = `[${timestamp}] ${levelUpper} ${message}`;

  if (context && Object.keys(context).length > 0) {
    const sanitizedContext = process.env.NODE_ENV === 'production'
      ? sanitizeData(context)
      : context;
    formatted += ` ${JSON.stringify(sanitizedContext)}`;
  }

  return formatted;
}

/**
 * Logger class
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Debug level - only logged in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formatted = formatLogMessage('debug', message, context);
      console.log(formatted);
    }
  }

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext): void {
    const formatted = formatLogMessage('info', message, context);
    console.log(formatted);
  }

  /**
   * Warning level - something unexpected but not critical
   */
  warn(message: string, context?: LogContext): void {
    const formatted = formatLogMessage('warn', message, context);
    console.warn(formatted);
  }

  /**
   * Error level - critical issues
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    } else if (error) {
      errorContext.error = error;
    }

    const formatted = formatLogMessage('error', message, errorContext);
    console.error(formatted);
  }

  /**
   * Time tracking - useful for performance monitoring
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * Time tracking end
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogLevel, LogContext };
