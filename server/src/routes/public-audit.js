/**
 * Public AI Readiness Audit (PRD v0.3, Phase 1) — no account needed.
 *
 *   POST /api/public/audit/claims                 { url }     → start a claim, get a token
 *   GET  /api/public/audit/claims/:claimId                    → claim status + latest audit id
 *   POST /api/public/audit/claims/:claimId/verify { method }  → check meta tag / DNS TXT / file
 *   POST /api/public/audit/claims/:claimId/audits             → run the site audit (verified only)
 *   GET  /api/public/audit/claims/:claimId/audits/:auditId    → the audit, for the claim holder
 *
 * The claim id (a random UUID) is the capability the visitor holds; nothing
 * here reads a user session. Saving a claim to an account happens on the
 * authenticated API (routes/audits.js).
 *
 * Mounted before the auth middleware, behind the public rate limiter.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import supabaseAdmin from '../config/supabase.js';
import logger from '../lib/logger.js';
import { assembleAudit, startClaimAudit } from './audits.js';

const router = Router();

const limitMessage = { success: false, message: 'Too many requests, please try again later.' };
/** Reads (polling a running audit every few seconds) get a roomy allowance. */
router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 400, standardHeaders: true, legacyHeaders: false, message: limitMessage }));
/** Starting claims, verifying and running audits cost crawls: keep them tight per IP. */
const writeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: limitMessage });

const TOKEN_PREFIX = 'zentic-site-verification';
/** Audits per domain per rolling 24 hours, across all visitors. */
const AUDITS_PER_DOMAIN_PER_DAY = 3;
/** Audits per claim per rolling 30 days: the first audit plus one re-audit. */
const AUDITS_PER_CLAIM_PER_MONTH = 2;
const FETCH_TIMEOUT_MS = 8000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Local development only: treat every verification as found. */
function devSkipVerify() {
  return process.env.NODE_ENV !== 'production' && process.env.PUBLIC_AUDIT_DEV_SKIP_VERIFY === 'true';
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:127.') || v.startsWith('::ffff:10.') || v.startsWith('::ffff:192.168.');
  }
  return true;
}

/**
 * Normalise what the visitor typed into a site: https, host only (paths are
 * dropped for the site-level checks), lower case. Rejects IPs, single-label
 * hosts and anything resolving to a private network.
 */
export async function normalizeSite(raw) {
  const input = String(raw ?? '').trim();
  if (!input || input.length > 2048) return { error: 'Enter your website address, like yourbusiness.com.' };

  let parsed;
  try {
    parsed = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { error: 'That doesn’t look like a website address. Try something like yourbusiness.com.' };
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!host.includes('.') || net.isIP(host) || host.endsWith('.local') || host.endsWith('.internal') || host === 'localhost') {
    return { error: 'That doesn’t look like a public website address. Try something like yourbusiness.com.' };
  }

  try {
    const addrs = await dns.lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
      return { error: 'We can only check public websites.' };
    }
  } catch {
    return { error: `We couldn’t find ${host}. Check the spelling and try again.` };
  }

  const domain = host.replace(/^www\./, '');
  return { domain, siteUrl: `https://${host}/` };
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'ZenticSiteVerification/1.0 (+https://zentic.ai)' },
    });
    const body = res.ok ? (await res.text()).slice(0, 2_000_000) : '';
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: '', error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

function metaTagFound(html, token) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  return tags.some(
    (tag) =>
      new RegExp(`name\\s*=\\s*["']${TOKEN_PREFIX}["']`, 'i').test(tag) &&
      new RegExp(`content\\s*=\\s*["']${token}["']`, 'i').test(tag),
  );
}

/** Check one verification method. Returns { found, message }. */
async function checkOwnership(claim, method) {
  if (devSkipVerify()) return { found: true, message: 'Verified (local development bypass).' };

  if (method === 'meta') {
    const page = await fetchWithTimeout(claim.site_url);
    if (!page.ok) {
      return {
        found: false,
        message: page.error === 'timeout'
          ? `Your home page took too long to load. Try again in a minute.`
          : `We couldn’t load ${claim.site_url} (status ${page.status || 'no response'}).`,
      };
    }
    if (metaTagFound(page.body, claim.token)) return { found: true, message: 'Tag found on your home page.' };
    return {
      found: false,
      message: 'We couldn’t find the tag on your home page. Your site may be cached; try again in 5 minutes, or use the DNS or file method instead.',
    };
  }

  if (method === 'dns') {
    try {
      const records = await dns.resolveTxt(claim.domain);
      const flat = records.map((parts) => parts.join(''));
      if (flat.includes(`${TOKEN_PREFIX}=${claim.token}`)) return { found: true, message: 'DNS record found.' };
      return { found: false, message: 'We couldn’t find the TXT record yet. DNS changes can take a few minutes, sometimes longer, to show.' };
    } catch {
      return { found: false, message: `We couldn’t read DNS records for ${claim.domain}. Try again in a few minutes.` };
    }
  }

  if (method === 'file') {
    const fileUrl = new URL(`/${TOKEN_PREFIX}-${claim.token}.html`, claim.site_url).toString();
    const file = await fetchWithTimeout(fileUrl);
    if (file.ok && file.body.includes(claim.token)) return { found: true, message: 'Verification file found.' };
    return { found: false, message: `We couldn’t find ${fileUrl}. Check it’s uploaded to your site’s root folder.` };
  }

  return { found: false, message: 'Choose a verification method.' };
}

function claimPayload(claim, latestAuditId = null) {
  return {
    id: claim.id,
    domain: claim.domain,
    siteUrl: claim.site_url,
    verified: Boolean(claim.verified_at),
    verifyMethod: claim.verify_method,
    saved: Boolean(claim.saved_at),
    latestAuditId,
    verification: {
      meta: `<meta name="${TOKEN_PREFIX}" content="${claim.token}">`,
      dns: { type: 'TXT', host: '@', value: `${TOKEN_PREFIX}=${claim.token}` },
      file: {
        name: `${TOKEN_PREFIX}-${claim.token}.html`,
        url: new URL(`/${TOKEN_PREFIX}-${claim.token}.html`, claim.site_url).toString(),
        content: `${TOKEN_PREFIX}: ${claim.token}`,
      },
    },
  };
}

async function loadClaim(claimId) {
  if (!UUID_RE.test(claimId ?? '')) return null;
  const { data } = await supabaseAdmin.from('public_site_claims').select('*').eq('id', claimId).maybeSingle();
  return data ?? null;
}

async function latestAuditId(claimId) {
  const { data } = await supabaseAdmin
    .from('site_audits')
    .select('id')
    .eq('claim_id', claimId)
    .is('parent_audit_id', null)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0]?.id ?? null;
}

// POST /claims — start (or resume) an ownership claim for a site.
router.post('/claims', writeLimiter, async (req, res) => {
  const site = await normalizeSite(req.body?.url);
  if (site.error) return res.status(400).json({ success: false, message: site.error });

  const token = crypto.randomBytes(16).toString('hex');
  const { data: claim, error } = await supabaseAdmin
    .from('public_site_claims')
    .insert({ domain: site.domain, site_url: site.siteUrl, token })
    .select('*')
    .single();
  if (error) {
    req.log.error({ err: error }, 'public audit: claim insert failed');
    const missingTable = ['42P01', 'PGRST205'].includes(error.code) || /public_site_claims/.test(error.message ?? '');
    const message =
      missingTable && process.env.NODE_ENV !== 'production'
        ? 'The database is missing the public audit table. Run "npx supabase migration up" in the zentic folder, then try again.'
        : 'Something went wrong. Please try again.';
    return res.status(500).json({ success: false, message });
  }
  return res.status(201).json({ success: true, claim: claimPayload(claim) });
});

// GET /claims/:claimId
router.get('/claims/:claimId', async (req, res) => {
  const claim = await loadClaim(req.params.claimId);
  if (!claim) return res.status(404).json({ success: false, message: 'Not found' });
  return res.json({ success: true, claim: claimPayload(claim, await latestAuditId(claim.id)) });
});

// POST /claims/:claimId/verify { method }
router.post('/claims/:claimId/verify', writeLimiter, async (req, res) => {
  const claim = await loadClaim(req.params.claimId);
  if (!claim) return res.status(404).json({ success: false, message: 'Not found' });

  const method = ['meta', 'dns', 'file'].includes(req.body?.method) ? req.body.method : null;
  if (!method) return res.status(400).json({ success: false, message: 'Choose a verification method.' });

  const result = await checkOwnership(claim, method);
  if (result.found) {
    const { data: updated } = await supabaseAdmin
      .from('public_site_claims')
      .update({ verified_at: new Date().toISOString(), verify_method: method })
      .eq('id', claim.id)
      .select('*')
      .single();
    return res.json({ success: true, verified: true, message: result.message, claim: claimPayload(updated ?? claim) });
  }
  return res.json({ success: true, verified: false, message: result.message });
});

// POST /claims/:claimId/audits — run the audit for a verified claim.
router.post('/claims/:claimId/audits', writeLimiter, async (req, res) => {
  const claim = await loadClaim(req.params.claimId);
  if (!claim) return res.status(404).json({ success: false, message: 'Not found' });
  if (!claim.verified_at) {
    return res.status(403).json({ success: false, error: 'not_verified', message: 'Verify that you own this site first.' });
  }

  // Before every re-audit, re-check that the token is still published.
  const isReaudit = Boolean(await latestAuditId(claim.id));
  if (isReaudit && claim.verify_method) {
    const still = await checkOwnership(claim, claim.verify_method);
    if (!still.found) {
      await supabaseAdmin.from('public_site_claims').update({ verified_at: null }).eq('id', claim.id);
      return res.status(403).json({
        success: false,
        error: 'not_verified',
        message: 'Your verification is no longer on the site. Add it back and verify again to re-audit.',
      });
    }
  }

  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: domainClaims } = await supabaseAdmin
    .from('public_site_claims')
    .select('id')
    .eq('domain', claim.domain);
  const claimIds = (domainClaims ?? []).map((c) => c.id);
  const { count: domainCount } = await supabaseAdmin
    .from('site_audits')
    .select('id', { count: 'exact', head: true })
    .in('claim_id', claimIds.length ? claimIds : [claim.id])
    .is('parent_audit_id', null)
    .gte('created_at', dayAgo);
  if ((domainCount ?? 0) >= AUDITS_PER_DOMAIN_PER_DAY) {
    return res.status(429).json({
      success: false,
      error: 'domain_limit',
      message: `${claim.domain} has been audited ${AUDITS_PER_DOMAIN_PER_DAY} times today. Try again tomorrow.`,
    });
  }

  const { count: claimCount } = await supabaseAdmin
    .from('site_audits')
    .select('id', { count: 'exact', head: true })
    .eq('claim_id', claim.id)
    .is('parent_audit_id', null)
    .gte('created_at', monthAgo);
  if ((claimCount ?? 0) >= AUDITS_PER_CLAIM_PER_MONTH) {
    return res.status(429).json({
      success: false,
      error: 'reaudit_limit',
      message: 'You’ve used your free re-audit for this month. You can re-audit again once 30 days have passed since your earlier audit.',
    });
  }

  try {
    const audit = await startClaimAudit(claim);
    return res.status(202).json({ success: true, audit });
  } catch (err) {
    req.log.error({ err }, 'public audit: start failed');
    return res.status(500).json({ success: false, message: 'We couldn’t start the audit. Please try again.' });
  }
});

// GET /claims/:claimId/audits/:auditId
router.get('/claims/:claimId/audits/:auditId', async (req, res) => {
  const { claimId, auditId } = req.params;
  if (!UUID_RE.test(claimId) || !UUID_RE.test(auditId)) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  const { data: audit } = await supabaseAdmin
    .from('site_audits')
    .select('*')
    .eq('id', auditId)
    .eq('claim_id', claimId)
    .maybeSingle();
  if (!audit) return res.status(404).json({ success: false, message: 'Not found' });

  const [{ data: signalRows }, { data: pageRows }] = await Promise.all([
    supabaseAdmin.from('audit_signal_results').select('*').eq('audit_id', auditId),
    supabaseAdmin
      .from('site_audits')
      .select('id, url, page_label, status, total_score, error, created_at')
      .eq('parent_audit_id', auditId)
      .order('created_at', { ascending: true }),
  ]);
  // Children are inserted in one statement (same created_at): keep Home first.
  const sortedRows = [...(pageRows ?? [])].sort((a, b) => (a.page_label === 'Home' ? -1 : b.page_label === 'Home' ? 1 : 0));
  const pages = sortedRows.map((p) => ({
    id: p.id,
    url: p.url,
    label: p.page_label ?? 'Page',
    status: p.status,
    totalScore: p.total_score === null ? null : Number(p.total_score),
    error: p.error ?? null,
  }));
  return res.json({ success: true, audit: { ...assembleAudit(audit, signalRows ?? []), pages } });
});

router.use((err, req, res, _next) => {
  logger.error({ err }, 'public audit: unhandled error');
  res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
});

export default router;
