import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = [
  '/dashboard',
  '/meal-plans',
  '/grocery-list',
  '/progress',
  '/health-tracker',
  '/community',
];

const publicPaths = [
  '/signin',
  '/signup',
  '/',
  '/api/auth',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    if (!sessionToken) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 