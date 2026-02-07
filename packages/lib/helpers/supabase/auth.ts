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
    console.error('[AUTH_ERROR]', {
      reason: 'no_session',
      timestamp: new Date().toISOString(),
    });
    throw new Error('Authentication failed');
  }

  // Extract database userId from user_metadata
  const userId = supabaseUser.user_metadata?.userId;

  if (!userId) {
    console.error('[AUTH_ERROR]', {
      reason: 'missing_user_metadata',
      supabaseUserId: supabaseUser.id,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Authentication failed');
  }

  // Fetch full user record from database
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error('[AUTH_ERROR]', {
      reason: 'user_not_found_in_database',
      userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Authentication failed');
  }

  // Check account status
  if (!user.isActive) {
    console.warn('[AUTH_WARNING]', {
      reason: 'account_inactive',
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Your account is currently inactive');
  }

  return user;
}

/**
 * Get just the userId (lightweight version)
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();

  if (!user) {
    console.error('[AUTH_ERROR]', {
      reason: 'no_session',
      timestamp: new Date().toISOString(),
    });
    throw new Error('Authentication failed');
  }

  const userId = user.user_metadata?.userId;

  if (!userId) {
    console.error('[AUTH_ERROR]', {
      reason: 'missing_user_metadata',
      supabaseUserId: user.id,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Authentication failed');
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

  if (!report) {
    console.warn('[ACCESS_DENIED]', {
      reason: 'report_not_found',
      reportId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Resource not found');
  }

  if (report.userId !== user.id) {
    console.warn('[ACCESS_DENIED]', {
      reason: 'unauthorized_report_access',
      reportId,
      userId: user.id,
      reportOwnerId: report.userId,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Access denied');
  }
}
