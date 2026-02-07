import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_SIGNIN_ROUTE } from './packages/lib/routes';

// CORS configuration
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Add production domain if configured
if (process.env.NEXT_PUBLIC_PRODUCTION_URL) {
  ALLOWED_ORIGINS.push(process.env.NEXT_PUBLIC_PRODUCTION_URL);
}

export const config = {
  matcher: [
    // Protected page routes (main app) - everything under (main) directory
    '/dashboard/:path*',
    '/reports/:path*',
    '/settings/:path*',

    // Protected API routes that require authentication
    '/api/reports/:path*',
    '/api/settings/:path*',
  ],
};

export async function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Set CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // For preflight requests
    if (request.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 200 });

      if (isAllowedOrigin) {
        preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      }

      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      preflightResponse.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      preflightResponse.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      );
      preflightResponse.headers.set('Access-Control-Max-Age', '86400');

      return preflightResponse;
    }

    // For actual requests, set CORS headers on the response
    if (isAllowedOrigin) {
      supabaseResponse.headers.set('Access-Control-Allow-Origin', origin);
      supabaseResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No user, redirect to signin
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_SIGNIN_ROUTE;
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
}
