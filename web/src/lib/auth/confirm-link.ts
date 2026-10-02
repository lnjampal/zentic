import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Where to send someone after an email link is verified. Paths and same-origin
 * URLs only: a link must never forward to another site.
 */
export function resolveRedirect(value: string | null, origin: string): string {
  const fallback = `${origin}/dashboard`;
  if (!value) return fallback;
  if (value.startsWith('/') && !value.startsWith('//')) return `${origin}${value}`;
  try {
    const url = new URL(value);
    return url.origin === origin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function signInWith(origin: string, error: string, next: string | null): NextResponse {
  const url = new URL('/sign-in', origin);
  url.searchParams.set('error', error);
  if (next && next.startsWith('/') && !next.startsWith('//')) url.searchParams.set('next', next);
  return NextResponse.redirect(url);
}

/**
 * GET /auth/confirm: finish an email link (confirm sign-up, reset password,
 * invite, magic link) and set the session cookies server-side.
 *
 * Two link shapes arrive here:
 *  - `token_hash` + `type`: custom email templates
 *    (`{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`). Works on any device.
 *  - `code`: Supabase's default templates with the PKCE flow. Works in the
 *    browser the request was started from (it holds the code verifier).
 * An expired or reused link comes back with `error` / `error_code` instead.
 */
export async function handleAuthConfirm(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const redirectTarget = resolveRedirect(searchParams.get('redirect_to') ?? next, origin);

  if (searchParams.get('error') || searchParams.get('error_code')) {
    return signInWith(origin, 'link_expired', next);
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return error ? signInWith(origin, 'link_expired', next) : NextResponse.redirect(redirectTarget);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Opened in a different browser: the email is confirmed, but we can't sign them in here.
    return error ? signInWith(origin, 'link_other_browser', next) : NextResponse.redirect(redirectTarget);
  }

  return signInWith(origin, 'link_expired', next);
}
