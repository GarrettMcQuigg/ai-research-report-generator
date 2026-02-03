import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { createServiceClient } from '@/packages/lib/supabase/server';
import { db } from '@/packages/lib/prisma/prisma-client';
import { handleSuccess, handleBadRequest, handleError } from '@/packages/lib/helpers/api-response-handlers';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return handleBadRequest({ message: 'Email, password, and name are required' });
    }

    if (password.length < 8) {
      return handleBadRequest({ message: 'Password must be at least 8 characters' });
    }

    // Check for existing user in database
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return handleBadRequest({ message: 'An account with this email already exists' });
    }

    // Create Supabase auth user (service role to auto-confirm email)
    const supabaseAdmin = createServiceClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification
      user_metadata: { name },
    });

    if (authError || !authData.user) {
      console.error('Supabase auth creation error:', authError);
      return handleBadRequest({
        message: authError?.message || 'Failed to create user',
      });
    }

    // Hash password for database
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record in Prisma database
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Link Supabase auth user to database user via metadata
    // This is CRITICAL - user_metadata.userId is the link between auth and database
    await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        userId: user.id, // Database user.id
        name,
      },
    });

    return handleSuccess({
      message: 'User created successfully',
      content: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return handleError({ message: 'An error occurred during signup' });
  }
}
