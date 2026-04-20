import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'dashboard_auth';

export async function GET(request: NextRequest) {
  const isAuthenticated = request.cookies.get(AUTH_COOKIE)?.value === '1';
  return NextResponse.json({ authenticated: isAuthenticated }, { status: 200 });
}
