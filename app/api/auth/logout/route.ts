import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AUTH_COOKIE = 'dashboard_auth';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
