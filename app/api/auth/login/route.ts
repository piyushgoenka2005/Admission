import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AUTH_COOKIE = 'dashboard_auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body?.password || '');
    const expectedPassword = process.env.DASHBOARD_PASSWORD || 'admin123';

    if (!password || password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: 'Login successful' }, { status: 200 });
    response.cookies.set(AUTH_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
