'use server';

import { createClient } from '@/lib/supabase/server';
import { API_BASE_URL } from '@/config/api';

export interface SavedClaim {
  id: string;
  domain: string;
  siteUrl: string;
  verified: boolean;
  savedAt: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  brandId: string | null;
  audits: { id: string; status: 'running' | 'completed' | 'failed'; totalScore: number | null; createdAt: string }[];
}

async function accessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Attach a public audit claim to the signed-in user. */
export interface SaveClaimResult {
  ok: true;
  owner: { email: string | null; name: string | null };
  brandId: string | null;
  /** Set when the org already tracks this site: the report is in that brand's dashboard too. */
  dashboardAuditId: string | null;
}

export async function savePublicClaim(
  claimId: string,
  marketingConsent: boolean,
): Promise<SaveClaimResult | { ok: false; status: number; message: string }> {
  const token = await accessToken();
  if (!token) return { ok: false, status: 401, message: 'Not authenticated' };

  const res = await fetch(`${API_BASE_URL}/api/audits/public-claims/${encodeURIComponent(claimId)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ marketingConsent }),
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    return {
      ok: true,
      owner: body.owner ?? { email: null, name: null },
      brandId: body.brandId ?? null,
      dashboardAuditId: body.dashboardAuditId ?? null,
    };
  }
  return { ok: false, status: res.status, message: body.message || `Server error: ${res.status}` };
}

/** The signed-in user's saved public audits, newest first. */
export async function listSavedClaims(): Promise<SavedClaim[]> {
  const token = await accessToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE_URL}/api/audits/public-claims`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const body = await res.json().catch(() => ({}));
  return body.claims ?? [];
}
