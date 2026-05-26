import { NextResponse } from 'next/server';

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Reject oversized request bodies
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ message: 'Request body too large' }, { status: 413 });
  }

  // Public routes - no auth needed
  const publicRoutes = ['/login', '/register', '/api/auth/'];
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  // Public API routes
  const publicApiRoutes = ['/api/auth/register', '/api/auth/send-otp', '/api/auth/verify-otp', '/api/auth/verify-firebase-token', '/api/auth/refresh'];
  const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route));

  // Static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname === '/') {
    return NextResponse.next();
  }

  if (isPublic || isPublicApi) {
    return NextResponse.next();
  }

  // For dashboard pages - check if auth token exists in cookie or redirect
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('authToken')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // For protected API routes - check Authorization header
  if (pathname.startsWith('/api/') && !isPublicApi) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com https://www.google.com; frame-src https://www.google.com https://recaptcha.google.com https://*.firebaseapp.com;"
  );
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
