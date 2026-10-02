import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

const protectedPathnames = ['/dashboard'];
const authPathnames = ['/sign-in', '/sign-up'];

function isProtected(pathname: string): boolean {
  return protectedPathnames.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthRoute(pathname: string): boolean {
  return authPathnames.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameWithoutLocale = pathname.replace(/^\/(en)/, '') || '/';

  let supabaseResponse: NextResponse | undefined;
  let user: { id: string } | null = null;

  try {
    const session = await updateSession(request);
    supabaseResponse = session.supabaseResponse;
    user = session.user;
  } catch {
    // Supabase session refresh failed — continue without auth context
    // so next-intl locale routing still works
  }

  // '/' is the public home page (the offers page), for visitors and signed-in users alike.

  // An email link that Supabase sends back to the Site URL (its fallback when
  // no redirect was given) arrives as `/?code=…`. Hand it to /auth/confirm so
  // the person is signed in instead of landing on the home page signed out.
  if (pathnameWithoutLocale === '/' && request.nextUrl.searchParams.has('code')) {
    const confirmUrl = new URL('/auth/confirm', request.url);
    confirmUrl.searchParams.set('code', request.nextUrl.searchParams.get('code')!);
    return NextResponse.redirect(confirmUrl);
  }

  // The pricing page lives on the marketing site (zentic.ai/pricing) now,
  // not the app subdomain — redirect any stale links / bookmarks so they
  // land on the canonical page instead of 404'ing (#113).
  if (pathnameWithoutLocale === '/pricing') {
    return NextResponse.redirect('https://zentic.ai/pricing', 302);
  }

  if (isProtected(pathnameWithoutLocale) && !user) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute(pathnameWithoutLocale) && user) {
    // Honour a same-site ?next= (e.g. "save my audit report") before the dashboard default.
    const next = request.nextUrl.searchParams.get('next');
    const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Workaround for a Next.js framework issue (vercel/next.js#91723): RSC
  // prefetch/navigation requests and server-action POSTs that go through
  // next-intl's middleware intermittently die server-side with "The router
  // state header was sent but could not be parsed" — and the client then
  // holds its whole server-action queue behind the failed transition, which
  // froze the Prompts page. With a single 'en' locale the only thing the
  // intl middleware does for these requests is the /en rewrite, so do that
  // by hand and skip the intl machinery entirely.
  const isRscOrAction = request.headers.has('rsc') || request.headers.has('next-action');
  if (isRscOrAction) {
    const needsLocalePrefix = !(pathname === '/en' || pathname.startsWith('/en/'));
    const response = needsLocalePrefix
      ? NextResponse.rewrite(new URL(`/en${pathname}${request.nextUrl.search}`, request.url), {
          request,
        })
      : NextResponse.next({ request });
    if (supabaseResponse) {
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
      });
    }
    return response;
  }

  const intlResponse = intlMiddleware(request);

  if (supabaseResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
