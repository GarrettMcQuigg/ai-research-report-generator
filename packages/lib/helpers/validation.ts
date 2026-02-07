/**
 * Input validation and sanitization helpers
 * Provides security-focused validation for user inputs
 */

/**
 * Validates email format using RFC 5322 compliant regex pattern
 * @param email - Email address to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();

  // Check length constraints (RFC 5321)
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false;
  }

  // RFC 5322 compliant email regex
  // More comprehensive than simple pattern, validates local and domain parts
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  // Additional validation: check for valid TLD (at least 2 chars)
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];
  const domainParts = domain.split('.');

  // Must have at least one dot in domain
  if (domainParts.length < 2) {
    return false;
  }

  // TLD must be at least 2 characters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return false;
  }

  return true;
}

/**
 * Validates and sanitizes a research topic
 * Removes potentially dangerous characters and enforces length limits
 * @param topic - Topic string to sanitize
 * @returns Sanitized topic string
 * @throws Error if topic is invalid
 */
export function sanitizeTopic(topic: unknown): string {
  if (!topic || typeof topic !== 'string') {
    throw new Error('INVALID_TOPIC_TYPE');
  }

  // Trim whitespace
  let sanitized = topic.trim();

  // Check length constraints
  if (sanitized.length < 3) {
    throw new Error('TOPIC_TOO_SHORT');
  }

  if (sanitized.length > 500) {
    throw new Error('TOPIC_TOO_LONG');
  }

  // Remove control characters and potentially dangerous characters
  // Keep alphanumeric, spaces, and common punctuation
  sanitized = sanitized.replace(/[^\w\s.,;:?!()\-'"/&]/g, '');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Final validation
  if (sanitized.length < 3) {
    throw new Error('TOPIC_INVALID_AFTER_SANITIZATION');
  }

  return sanitized;
}

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Optional: special characters (recommended but not required)
 * @param password - Password to validate
 * @returns Object with validation result and error code if invalid
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'PASSWORD_REQUIRED' };
  }

  // Minimum length requirement increased to 8 characters
  if (password.length < 8) {
    return { valid: false, error: 'PASSWORD_TOO_SHORT' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'PASSWORD_TOO_LONG' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'PASSWORD_MISSING_UPPERCASE' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'PASSWORD_MISSING_LOWERCASE' };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, error: 'PASSWORD_MISSING_NUMBER' };
  }

  // Optional: Check for special characters (good practice but not required)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSpecialChar) {
    // Log recommendation but don't fail validation
    // This could be enhanced to return a warning field in the future
  }

  return { valid: true };
}

/**
 * Validates name/display name
 * @param name - Name to validate
 * @returns true if valid, false otherwise
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  // Check length
  if (trimmed.length < 1 || trimmed.length > 100) {
    return false;
  }

  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;

  return nameRegex.test(trimmed);
}

/**
 * Sanitize string for safe logging (removes sensitive patterns)
 * @param str - String to sanitize
 * @returns Sanitized string safe for logging
 */
export function sanitizeForLogging(str: string): string {
  if (!str || typeof str !== 'string') {
    return '[invalid]';
  }

  // Remove email patterns
  let sanitized = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // Remove potential tokens/keys
  sanitized = sanitized.replace(/[A-Za-z0-9_-]{20,}/g, '[TOKEN]');

  // Remove potential IDs
  sanitized = sanitized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[UUID]');

  return sanitized;
}

/**
 * Error code to user-friendly message mapping
 * Use this to provide consistent error messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  AUTH_FAILED: 'Authentication failed',
  SESSION_INVALID: 'Your session has expired. Please log in again',
  ACCOUNT_INACTIVE: 'Your account is currently inactive',
  UNAUTHORIZED: 'You are not authorized to perform this action',

  // Validation errors
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PASSWORD: 'Password does not meet requirements',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 12 characters',
  PASSWORD_TOO_LONG: 'Password must be less than 128 characters',
  PASSWORD_TOO_WEAK: 'Password must contain at least one number or special character',
  PASSWORD_MISSING_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_MISSING_LOWERCASE: 'Password must contain at least one lowercase letter',
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number',
  INVALID_NAME: 'Please provide a valid name',

  // Topic errors
  INVALID_TOPIC: 'Please provide a valid research topic',
  TOPIC_TOO_SHORT: 'Topic must be at least 3 characters',
  TOPIC_TOO_LONG: 'Topic must be less than 500 characters',

  // Resource errors
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  INSUFFICIENT_CREDITS: 'You do not have enough credits',

  // Generic errors
  BAD_REQUEST: 'Invalid request',
  INTERNAL_ERROR: 'An error occurred while processing your request',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
};

/**
 * Get user-friendly error message from error code
 * @param errorCode - Error code
 * @returns User-friendly error message
 */
export function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.INTERNAL_ERROR;
}
