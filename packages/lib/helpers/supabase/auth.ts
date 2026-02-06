import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';
import { User } from '@prisma/client';
import { db } from '@/packages/lib/prisma/prisma-client';
import { createClient } from '@/packages/lib/supabase/server';

/**
 * Get the current Supabase auth user from session
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Can only be called in Server Actions/Route Handlers
          }
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the database User record for the currently authenticated user
 * This is the PRIMARY AUTH FUNCTION - use this in most API routes
 */
export async function getUser(): Promise<User> {
  const supabaseUser = await getCurrentUser();

  if (!supabaseUser) {
    throw new Error('Unauthorized: No user session');
  }

  // Extract database userId from user_metadata
  const userId = supabaseUser.user_metadata?.userId;

  if (!userId) {
    throw new Error('Unauthorized: No userId in user metadata');
  }

  // Fetch full user record from database
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Unauthorized: User not found in database');
  }

  // Check account status
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }

  return user;
}

/**
 * Get just the userId (lightweight version)
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: No user session');
  }

  const userId = user.user_metadata?.userId;

  if (!userId) {
    throw new Error('Unauthorized: No userId in user metadata');
  }

  return userId;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in API routes where you need the full User object
 */
export async function requireAuth(): Promise<User> {
  try {
    return await getUser();
  } catch {
    throw new Response('Unauthorized', { status: 401 });
  }
}

/**
 * Validate the current session
 */
export async function validateSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return session;
}

/**
 * Verify user has access to a specific report
 */
export async function verifyReportAccess(reportId: string): Promise<void> {
  const user = await getUser();

  const report = await db.report.findUnique({
    where: { id: reportId },
  });

  if (!report || report.userId !== user.id) {
    throw new Error('Forbidden: Access to this report is denied');
  }
}
