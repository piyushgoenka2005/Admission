import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'dashboard_auth';

function isAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(AUTH_COOKIE)?.value === '1';
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const protectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/intern') ||
    pathname.startsWith('/api/interns') ||
    pathname.startsWith('/api/letters');

  if (!protectedRoute) {
    return NextResponse.next();
  }

  if (isAuthenticated(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/intern/:path*', '/api/interns/:path*', '/api/letters/:path*'],
};
