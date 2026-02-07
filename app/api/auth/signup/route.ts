import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { createServiceClient } from '@/packages/lib/supabase/server';
import { db } from '@/packages/lib/prisma/prisma-client';
import { handleSuccess, handleBadRequest, handleError } from '@/packages/lib/helpers/api-response-handlers';
import { isValidEmail, validatePassword, isValidName, getErrorMessage } from '@/packages/lib/helpers/validation';
import { signupRateLimiter } from '@/packages/lib/middleware/rate-limit';
import { logger } from '@/packages/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per 15 minutes per IP)
    const rateLimitResult = await signupRateLimiter(request, 'signup');
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    const { email, password, name } = await request.json();

    // Input validation
    if (!email || !password || !name) {
      logger.warn('Signup validation failed - missing fields', {
        reason: 'missing_fields',
        hasEmail: !!email,
        hasPassword: !!password,
        hasName: !!name,
      });
      return handleBadRequest({ message: getErrorMessage('BAD_REQUEST') });
    }

    // Validate email
    if (!isValidEmail(email)) {
      logger.warn('Signup validation failed - invalid email', {
        reason: 'invalid_email',
      });
      return handleBadRequest({ message: getErrorMessage('INVALID_EMAIL') });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      logger.warn('Signup validation failed - invalid password', {
        reason: passwordValidation.error,
      });
      return handleBadRequest({
        message: getErrorMessage(passwordValidation.error || 'INVALID_PASSWORD')
      });
    }

    // Validate name
    if (!isValidName(name)) {
      logger.warn('Signup validation failed - invalid name', {
        reason: 'invalid_name',
      });
      return handleBadRequest({ message: getErrorMessage('INVALID_NAME') });
    }

    // Check for existing user in database
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      logger.warn('Signup conflict - email exists', {
        reason: 'email_exists',
      });
      // Generic message to prevent email enumeration
      return handleBadRequest({ message: 'Unable to create account' });
    }

    // Create Supabase auth user (service role to auto-confirm email)
    const supabaseAdmin = createServiceClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Skip email verification
      user_metadata: { name: name.trim() },
    });

    if (authError || !authData.user) {
      logger.error('Signup error - Supabase auth failed', authError, {
        reason: 'supabase_auth_failed',
      });
      return handleError({ message: getErrorMessage('INTERNAL_ERROR') });
    }

    // Hash password for database
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record in Prisma database
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
      },
    });

    // Link Supabase auth user to database user via metadata
    // This is CRITICAL - user_metadata.userId is the link between auth and database
    await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        userId: user.id, // Database user.id
        name: name.trim(),
      },
    });

    logger.info('Signup successful', {
      userId: user.id,
    });

    return handleSuccess({
      message: 'Account created successfully',
      content: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error('Signup error', error);
    return handleError({ message: getErrorMessage('INTERNAL_ERROR') });
  }
}
