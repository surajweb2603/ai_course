import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/features',
  '/pricing',
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/courses',
  '/api/courses/',
  '/api/stripe/webhook',
  '/api/stripe/plans',
  '/api/certificates/verify',
  '/api/translate/languages',
];

// API routes that require authentication
const protectedApiRoutes = [
  '/api/dashboard',
  '/api/courses',
  '/api/generate',
  '/api/chat',
  '/api/quizzes',
  '/api/translate',
  '/api/certificates',
  '/api/media',
  '/api/stripe',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if it's a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedApiRoute) {
    // Just check for token presence - actual verification happens in route handlers
    // This avoids Edge Runtime issues with jsonwebtoken
    const authHeader = request.headers.get('authorization');
    const token = request.cookies.get('auth-token');
    
    // If no token at all, let route handler decide (some routes may be public)
    if (!authHeader && !token) {
      // Allow the route handler to handle auth - some routes may be public
      return NextResponse.next();
    }
  }

  // Check if it's a protected page route (exclude share routes)
  const isProtectedPage = (pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/course') && !pathname.startsWith('/course/share'))) ||
    (pathname.startsWith('/certificate') && !pathname.startsWith('/certificate/verify'));

  if (isProtectedPage) {
    // Check for token presence - actual verification happens in route handlers
    // This avoids Edge Runtime issues with jsonwebtoken
    const authHeader = request.headers.get('authorization');
    const token = request.cookies.get('auth-token');
    
    if (!authHeader && !token) {
      // Redirect to login if no token present
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

