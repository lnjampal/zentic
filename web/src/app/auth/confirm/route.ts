import { handleAuthConfirm } from '@/lib/auth/confirm-link';

/**
 * GET /auth/confirm: email links (confirm sign-up, reset password, invite,
 * magic link) land here. next-intl rewrites `/auth/*` to `/[locale]/auth/*`,
 * so the root and locale routes both delegate to the same handler.
 */
export async function GET(request: Request) {
  return handleAuthConfirm(request);
}
