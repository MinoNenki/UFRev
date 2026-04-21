import { NextResponse } from 'next/server';
import { env, isPrelaunchEnabled } from '@/lib/env';

export async function POST(request: Request) {
  const formData = await request.formData();
  const passwordValue = formData.get('password');
  const fromValue = formData.get('from');

  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const from = typeof fromValue === 'string' && fromValue.startsWith('/') ? fromValue : '/';

  if (!isPrelaunchEnabled) {
    return NextResponse.redirect(new URL(from, request.url));
  }

  if (password !== env.prelaunchPassword) {
    const redirectUrl = new URL('/launch-access', request.url);
    redirectUrl.searchParams.set('error', '1');
    if (from !== '/') {
      redirectUrl.searchParams.set('from', from);
    }
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(new URL(from, request.url));
  response.cookies.set(env.prelaunchCookieName, env.prelaunchPassword, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
