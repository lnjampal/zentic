import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { handleAuthConfirm, resolveRedirect } from './confirm-link';

const origin = 'https://app.example.com';

describe('resolveRedirect', () => {
  it('keeps same-site paths and URLs', () => {
    expect(resolveRedirect('/reset-password', origin)).toBe(`${origin}/reset-password`);
    expect(resolveRedirect(`${origin}/invite/abc`, origin)).toBe(`${origin}/invite/abc`);
  });
  it('falls back to the dashboard for other sites and junk', () => {
    expect(resolveRedirect('https://evil.example/x', origin)).toBe(`${origin}/dashboard`);
    expect(resolveRedirect('//evil.example', origin)).toBe(`${origin}/dashboard`);
    expect(resolveRedirect(null, origin)).toBe(`${origin}/dashboard`);
  });
});

describe('handleAuthConfirm', () => {
  const auth = { verifyOtp: vi.fn(), exchangeCodeForSession: vi.fn() };
  vi.mocked(createClient).mockResolvedValue({ auth } as never);
  const go = (qs: string) => handleAuthConfirm(new Request(`${origin}/auth/confirm?${qs}`));

  it('exchanges a PKCE code and forwards to next', async () => {
    auth.exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const res = await go('code=abc&next=/reset-password');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
    expect(res.headers.get('location')).toBe(`${origin}/reset-password`);
  });
  it('verifies a token hash and forwards to next', async () => {
    auth.verifyOtp.mockResolvedValueOnce({ error: null });
    const res = await go('token_hash=h&type=recovery&next=/reset-password');
    expect(res.headers.get('location')).toBe(`${origin}/reset-password`);
  });
  it('sends an expired link to sign-in with a reason', async () => {
    const res = await go('error=access_denied&error_code=otp_expired&next=/reset-password');
    expect(res.headers.get('location')).toBe(`${origin}/sign-in?error=link_expired&next=%2Freset-password`);
  });
  it('explains a code opened in another browser', async () => {
    auth.exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'no verifier' } });
    const res = await go('code=abc&next=/dashboard');
    expect(res.headers.get('location')).toBe(`${origin}/sign-in?error=link_other_browser&next=%2Fdashboard`);
  });
  it('treats a link with nothing to verify as expired', async () => {
    const res = await go('next=/reset-password');
    expect(res.headers.get('location')).toContain('/sign-in?error=link_expired');
  });
});
