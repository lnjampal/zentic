import { BROWSER_API_BASE_URL } from '@/config/api';
import type { AuditResult, AuditSignal, AuditRecommendation } from '@/lib/actions/audits';

/**
 * Browser client for the public AI Readiness Audit (no account needed).
 * Calls go through the same-origin proxy to the API server's
 * /api/public/audit routes.
 */

const BASE = `${BROWSER_API_BASE_URL}/api/public/audit`;

export type VerifyMethod = 'meta' | 'dns' | 'file';

export interface PublicClaim {
  id: string;
  domain: string;
  siteUrl: string;
  verified: boolean;
  verifyMethod: VerifyMethod | null;
  saved: boolean;
  latestAuditId: string | null;
  verification: {
    meta: string;
    dns: { type: string; host: string; value: string };
    file: { name: string; url: string; content: string };
  };
}

export class PublicAuditError extends Error {
  code: string | null;
  status: number;
  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
    });
  } catch {
    throw new PublicAuditError('We couldn’t reach Zentic. Check your connection and try again.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const message =
      body.message ||
      (res.status === 502 ? 'Zentic’s audit service isn’t reachable right now. Please try again in a minute.' : null) ||
      (typeof body.error === 'string' && body.error.includes(' ') ? body.error : null) ||
      `Something went wrong (error ${res.status}). Please try again.`;
    throw new PublicAuditError(message, res.status, typeof body.error === 'string' ? body.error : null);
  }
  return body as T;
}

export async function createClaim(url: string): Promise<PublicClaim> {
  const { claim } = await call<{ claim: PublicClaim }>('/claims', { method: 'POST', body: JSON.stringify({ url }) });
  return claim;
}

export async function getClaim(claimId: string): Promise<PublicClaim> {
  const { claim } = await call<{ claim: PublicClaim }>(`/claims/${claimId}`);
  return claim;
}

export async function verifyClaim(
  claimId: string,
  method: VerifyMethod,
): Promise<{ verified: boolean; message: string; claim?: PublicClaim }> {
  return call(`/claims/${claimId}/verify`, { method: 'POST', body: JSON.stringify({ method }) });
}

export async function startAudit(claimId: string): Promise<AuditResult> {
  const { audit } = await call<{ audit: AuditResult }>(`/claims/${claimId}/audits`, { method: 'POST', body: '{}' });
  return audit;
}

export async function getPublicAudit(claimId: string, auditId: string): Promise<AuditResult> {
  const { audit } = await call<{ audit: AuditResult }>(`/claims/${claimId}/audits/${auditId}`);
  return audit;
}

/** Score 0–1 → whole points out of 100. */
export function points(score: number | null): number | null {
  return score === null ? null : Math.round(score * 100);
}

export function readinessBand(score: number | null): 'Not ready' | 'Partly ready' | 'Ready' | null {
  if (score === null) return null;
  if (score >= 0.7) return 'Ready';
  if (score >= 0.4) return 'Partly ready';
  return 'Not ready';
}

export interface RankedFix {
  signal: AuditSignal;
  recommendation: AuditRecommendation | null;
  impact: 'High' | 'Medium' | 'Low';
}

const IMPACT_ORDER = { high: 0, medium: 1, standard: 2 } as const;

/** Failing and warning signals, ranked by impact tier, then failures first, then lowest score. */
export function rankFixes(audit: AuditResult): RankedFix[] {
  const recs = new Map(audit.recommendations.map((r) => [r.signalKey, r]));
  return audit.signals
    .filter((s) => s.status === 'fail' || s.status === 'warn')
    .sort((a, b) => {
      const ia = IMPACT_ORDER[a.impactTier ?? 'standard'] ?? 2;
      const ib = IMPACT_ORDER[b.impactTier ?? 'standard'] ?? 2;
      if (ia !== ib) return ia - ib;
      if (a.status !== b.status) return a.status === 'fail' ? -1 : 1;
      return (a.score ?? 0) - (b.score ?? 0);
    })
    .map((signal) => ({
      signal,
      recommendation: recs.get(signal.key) ?? null,
      impact: signal.impactTier === 'high' ? 'High' : signal.impactTier === 'medium' ? 'Medium' : 'Low',
    }));
}

/** A mailto: link with the top fixes, for "Send fixes to my web person". */
export function fixesMailto(domain: string, fixes: RankedFix[], reportUrl: string): string {
  const lines = fixes.slice(0, 10).map((f, i) => {
    const how = f.recommendation?.recommendation ?? f.signal.howToFix ?? '';
    return `${i + 1}. ${f.signal.label}\n   ${how}`;
  });
  const body = [
    `Hi,`,
    ``,
    `I ran a free AI readiness audit on ${domain} with Zentic. Could you apply these fixes, most important first?`,
    ``,
    ...lines,
    ``,
    `Full report, with copy-paste code for each fix: ${reportUrl}`,
    ``,
    `Thanks!`,
  ].join('\n');
  return `mailto:?subject=${encodeURIComponent(`AI readiness fixes for ${domain}`)}&body=${encodeURIComponent(body)}`;
}

export function verificationMailto(claim: PublicClaim, verifyUrl: string): string {
  const body = [
    `Hi,`,
    ``,
    `Could you add one of these to ${claim.domain} so I can verify it with Zentic? Any one is enough.`,
    ``,
    `Option 1, meta tag: paste this inside <head> on the home page:`,
    claim.verification.meta,
    ``,
    `Option 2, DNS: add a TXT record. Host: ${claim.verification.dns.host}  Value: ${claim.verification.dns.value}`,
    ``,
    `Option 3, file: upload a file named ${claim.verification.file.name} to the site root containing:`,
    claim.verification.file.content,
    `It should open at ${claim.verification.file.url}`,
    ``,
    `Once it's live, I'll press "Check now" here: ${verifyUrl}`,
    ``,
    `Thanks!`,
  ].join('\n');
  return `mailto:?subject=${encodeURIComponent(`Please verify ${claim.domain} for Zentic`)}&body=${encodeURIComponent(body)}`;
}
