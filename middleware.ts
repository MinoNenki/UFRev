import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { isPrelaunchEnabled, isSupabaseConfigured, env } from '@/lib/env';

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

function isPreviewBypassPath(pathname: string) {
  return pathname.startsWith('/launch-access') || pathname.startsWith('/api/launch-access') || pathname.startsWith('/api/auth/') || pathname === '/api/stripe/webhook';
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const previewCookie = request.cookies.get(env.prelaunchCookieName)?.value;

  if (isPrelaunchEnabled) {
    const hasPreviewAccess = previewCookie === env.prelaunchPassword;

    if (!hasPreviewAccess && !isPreviewBypassPath(pathname)) {
      const redirectUrl = new URL('/launch-access', request.url);
      if (pathname !== '/' || search) {
        redirectUrl.searchParams.set('from', `${pathname}${search}`);
      }
      return NextResponse.redirect(redirectUrl);
    }

    if (hasPreviewAccess && pathname === '/launch-access') {
      const from = request.nextUrl.searchParams.get('from');
      return NextResponse.redirect(new URL(from && from.startsWith('/') ? from : '/', request.url));
    }
  }

  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/|_document|_error|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
