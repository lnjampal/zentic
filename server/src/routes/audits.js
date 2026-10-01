/**
 * Site Audit routes — implements the AEO/GEO scoring rubric ourselves rather
 * than calling any third-party API.
 *
 *   POST /api/audits        { url, brandId }  → run a single-page audit
 *   GET  /api/audits/:id                      → fetch a stored audit + signals
 *   GET  /api/audits?brandId=…                → recent audits for a brand
 *
 * The audit runs synchronously: one Scrape.do fetch, the deterministic signal
 * engine, one batched LLM round-trip for the semantic signals, and a Wikidata
 * lookup — a few seconds total. Crawl / multi-page moves to a job later.
 */

import { Router } from 'express';
import supabaseAdmin from '../config/supabase.js';
import logger from '../lib/logger.js';
import { assertBrandAccess } from '../lib/access.js';
import {
  requireFeature,
  enforceSiteAuditQuota,
  getSiteAuditQuotaStatus,
  getOrgIdForUser,
  PlanLimitError,
} from '../lib/plan-guard.js';
import { buildAuditContext } from '../lib/audit/context.js';
import { runSignals } from '../lib/audit/engine.js';
import { evaluateLlmSignals } from '../lib/audit/llm-signals.js';
import { evaluateBrandEntity } from '../lib/audit/external-signals.js';
import { generateRecommendations } from '../lib/audit/recommendations.js';
import { scoreAudit } from '../lib/audit/scorer.js';
import { signalsByKey, TOTAL_SIGNALS, RUBRIC_VERSION } from '../lib/audit/rubric.js';
import { discoverKeyPages } from '../lib/audit/site-pages.js';
import { buildSiteFixes } from '../lib/audit/site-fixes.js';
import { fetchText } from '../lib/audit/fetcher.js';

const router = Router();

/**
 * Merge a stored audit row + its signal results with the rubric copy the UI
 * needs (label / what / why / howToFix / impactTier).
 */
export function assembleAudit(audit, signalRows) {
  const signals = signalRows.map((row) => {
    const meta = signalsByKey[row.signal_key] ?? {};
    return {
      key: row.signal_key,
      category: row.category ?? meta.category ?? null,
      status: row.status,
      score: row.score === null ? null : Number(row.score),
      evidence: row.evidence ?? {},
      label: meta.label ?? row.signal_key,
      what: meta.what ?? null,
      why: meta.why ?? null,
      howToFix: meta.howToFix ?? null,
      impactTier: meta.impactTier ?? null,
    };
  });

  return {
    id: audit.id,
    brandId: audit.brand_id,
    claimId: audit.claim_id ?? null,
    parentAuditId: audit.parent_audit_id ?? null,
    pageLabel: audit.page_label ?? null,
    url: audit.url,
    finalUrl: audit.final_url ?? null,
    status: audit.status,
    totalScore: audit.total_score === null ? null : Number(audit.total_score),
    categoryScores: audit.category_scores ?? {},
    signalsEvaluated: audit.signals_evaluated ?? null,
    signalsTotal: audit.signals_total ?? TOTAL_SIGNALS,
    rubricVersion: audit.rubric_version ?? RUBRIC_VERSION,
    error: audit.error ?? null,
    createdAt: audit.created_at,
    completedAt: audit.completed_at ?? null,
    signals,
    recommendations: audit.recommendations ?? [],
  };
}

/**
 * Run the full audit (fetch → deterministic + LLM + Wikidata → score →
 * persist) for an already-created `running` row. Runs detached from the
 * request so the client gets an id immediately and polls GET /:id. Always
 * resolves — on failure it marks the row `failed` rather than throwing.
 */
async function runAuditJob(auditId, brandId, url, orgId, { brandName = null } = {}) {
  try {
    // The brand name is only needed for the Wikidata brand-entity lookup. The
    // page is otherwise evaluated entirely on its own terms — the LLM infers
    // the page's own target topic from its content, so an arbitrary URL (a
    // competitor blog, any page) is never judged against this brand's topics.
    // Public audits (no brand yet) pass the site's own name instead.
    const { data: brandRow } = brandId
      ? await supabaseAdmin.from('brands').select('name').eq('id', brandId).single()
      : { data: { name: brandName } };

    const ctx = await buildAuditContext(url);

    // Deterministic engine, the batched LLM pass, and the Wikidata lookup run
    // concurrently. The latter two degrade to 'na' internally on failure.
    const [deterministic, llm, brandEntity] = await Promise.all([
      runSignals(ctx),
      evaluateLlmSignals(ctx),
      evaluateBrandEntity(brandRow?.name),
    ]);
    const results = [...deterministic, ...llm, brandEntity];

    const { totalScore, categoryScores } = scoreAudit(results);
    const signalsEvaluated = results.filter((r) => r.status !== 'na').length;

    const signalRows = results.map((r) => ({
      audit_id: auditId,
      signal_key: r.key,
      category: signalsByKey[r.key]?.category ?? null,
      status: r.status,
      score: r.score,
      evidence: r.evidence ?? {},
    }));
    const { error: sigErr } = await supabaseAdmin.from('audit_signal_results').insert(signalRows);
    if (sigErr) throw sigErr;

    // AI fix recommendations for the fixable failing signals (own LLM call;
    // degrades to [] on failure so it never blocks completion).
    const recommendations = await generateRecommendations(ctx, { results });

    const { error: completeErr } = await supabaseAdmin
      .from('site_audits')
      .update({
        status: 'completed',
        final_url: ctx.url,
        total_score: totalScore,
        category_scores: categoryScores,
        signals_evaluated: signalsEvaluated,
        signals_total: TOTAL_SIGNALS,
        recommendations,
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditId);
    // Don't let a failed completion update leave the row stuck in 'running'.
    if (completeErr) throw completeErr;

    // Charge the monthly quota only for audits that actually completed.
    if (orgId) {
      await supabaseAdmin
        .from('site_audit_usage')
        .insert({ organization_id: orgId, audit_id: auditId });
    }
  } catch (err) {
    logger.error({ err, auditId, brandId }, 'audit run failed');
    await supabaseAdmin
      .from('site_audits')
      .update({ status: 'failed', error: err.message, completed_at: new Date().toISOString() })
      .eq('id', auditId);
  }
}

/**
 * Enforce the monthly quota, create the `running` row, and kick off the
 * detached audit job. Shared by the dashboard POST handler and the internal
 * MCP endpoint. Returns the assembled (still-running) audit. Throws
 * PlanLimitError when the quota is exhausted — nothing is created in that case.
 */
export async function createAndRunAudit(brandId, url, orgId) {
  // Enforce the monthly Site Audit quota (Starter 100 / Growth 500;
  // Enterprise & self-hosted unlimited). Throws PlanLimitError when exhausted.
  await enforceSiteAuditQuota(orgId);

  const { data: created, error: insErr } = await supabaseAdmin
    .from('site_audits')
    .insert({ brand_id: brandId, url, status: 'running', rubric_version: RUBRIC_VERSION })
    .select('*')
    .single();
  if (insErr) throw insErr;

  // Fire-and-forget — the work continues after the response is sent.
  runAuditJob(created.id, brandId, url, orgId).catch((err) =>
    logger.error({ err, auditId: created.id, brandId }, 'audit background job crashed'),
  );

  return assembleAudit(created, []);
}

/** Max pages per public audit, home page included (PRD v0.3: home + key pages). */
export const PUBLIC_AUDIT_MAX_PAGES = 5;
const PAGE_CONCURRENCY = 2;
const STATUS_RANK = { fail: 3, warn: 2, pass: 1, na: 0 };

/**
 * Combine per-page signal results into one site-level result per signal:
 * the worst status across pages (so a problem on any key page shows), the
 * mean score of the pages where it applied, and which pages it affects.
 */
export function mergePageSignals(pageResults) {
  const byKey = new Map();
  for (const { page, signals } of pageResults) {
    for (const r of signals) {
      const entry = byKey.get(r.signal_key) ?? { key: r.signal_key, category: r.category, rows: [] };
      entry.rows.push({ page, status: r.status, score: r.score === null ? null : Number(r.score), evidence: r.evidence ?? {} });
      byKey.set(r.signal_key, entry);
    }
  }
  return [...byKey.values()].map(({ key, category, rows }) => {
    const applied = rows.filter((x) => x.status !== 'na' && typeof x.score === 'number');
    const worst = rows.reduce((w, x) => (STATUS_RANK[x.status] > STATUS_RANK[w] ? x.status : w), 'na');
    return {
      key,
      category,
      status: worst,
      score: applied.length ? applied.reduce((a, x) => a + x.score, 0) / applied.length : null,
      evidence: {
        pages: rows.map((x) => ({ url: x.page.url, label: x.page.label, status: x.status })),
        home: rows.find((x) => x.page.label === 'Home')?.evidence ?? rows[0]?.evidence ?? {},
      },
    };
  });
}

async function runWithConcurrency(items, limit, fn) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  });
  await Promise.all(workers);
}

/**
 * Multi-page site audit for a claim: discover the key pages, audit each with
 * the standard single-page job (one child row per page), then roll the pages
 * up into the parent row the report reads.
 */
async function runClaimSiteAudit(parentId, claim) {
  try {
    const { pages, homeHtml } = await discoverKeyPages(claim.site_url, { max: PUBLIC_AUDIT_MAX_PAGES });

    const { data: children, error: childErr } = await supabaseAdmin
      .from('site_audits')
      .insert(
        pages.map((p) => ({
          brand_id: null,
          claim_id: claim.id,
          parent_audit_id: parentId,
          url: p.url,
          page_label: p.label,
          status: 'running',
          rubric_version: RUBRIC_VERSION,
        })),
      )
      .select('id, url, page_label');
    if (childErr) throw childErr;

    const brandName = claim.domain.split('.')[0];
    await runWithConcurrency(children, PAGE_CONCURRENCY, (c) => runAuditJob(c.id, null, c.url, null, { brandName }));

    const { data: done } = await supabaseAdmin
      .from('site_audits')
      .select('id, url, page_label, status, error, recommendations')
      .eq('parent_audit_id', parentId);
    const completed = (done ?? []).filter((c) => c.status === 'completed');
    if (!completed.length) {
      throw new Error((done ?? []).find((c) => c.error)?.error ?? 'None of the pages could be checked');
    }

    const { data: sigRows } = await supabaseAdmin
      .from('audit_signal_results')
      .select('audit_id, signal_key, category, status, score, evidence')
      .in('audit_id', completed.map((c) => c.id));
    const pageResults = completed.map((c) => ({
      page: { url: c.url, label: c.page_label },
      signals: (sigRows ?? []).filter((r) => r.audit_id === c.id),
    }));
    const merged = mergePageSignals(pageResults);
    const { totalScore, categoryScores } = scoreAudit(merged);

    // LLM recommendations from the pages (home first), one per signal, plus
    // ready-to-paste site-level fixes built from the crawled HTML.
    const order = ['Home', ...pages.map((p) => p.label)];
    const llmRecs = completed
      .sort((a, b) => order.indexOf(a.page_label) - order.indexOf(b.page_label))
      .flatMap((c) => (c.recommendations ?? []).map((r) => ({ ...r, pageUrl: c.url })));
    const siteFixes = buildSiteFixes({
      signals: merged,
      homeHtml,
      homeUrl: claim.site_url,
      pages,
      robotsTxt: await fetchText(`${new URL(claim.site_url).origin}/robots.txt`).catch(() => null),
      labels: Object.fromEntries(Object.values(signalsByKey).map((x) => [x.key, x.label])),
    });
    const recommendations = [];
    const seen = new Set();
    for (const r of [...siteFixes, ...llmRecs]) {
      if (seen.has(r.signalKey)) continue;
      seen.add(r.signalKey);
      recommendations.push(r);
    }

    const { error: sigErr } = await supabaseAdmin.from('audit_signal_results').insert(
      merged.map((r) => ({
        audit_id: parentId,
        signal_key: r.key,
        category: r.category ?? signalsByKey[r.key]?.category ?? null,
        status: r.status,
        score: r.score,
        evidence: r.evidence,
      })),
    );
    if (sigErr) throw sigErr;

    const { error: upErr } = await supabaseAdmin
      .from('site_audits')
      .update({
        status: 'completed',
        final_url: claim.site_url,
        total_score: totalScore,
        category_scores: categoryScores,
        signals_evaluated: merged.filter((r) => r.status !== 'na').length,
        signals_total: TOTAL_SIGNALS,
        recommendations,
        completed_at: new Date().toISOString(),
      })
      .eq('id', parentId);
    if (upErr) throw upErr;
  } catch (err) {
    logger.error({ err, auditId: parentId, claimId: claim.id }, 'public site audit failed');
    await supabaseAdmin
      .from('site_audits')
      .update({ status: 'failed', error: err.message, completed_at: new Date().toISOString() })
      .eq('id', parentId);
  }
}

/**
 * Public AI Readiness Audit: create the site-level `running` row for a
 * verified claim (no brand, no org quota; the public route enforces its own
 * limits) and start the multi-page audit. Returns the still-running audit.
 */
export async function startClaimAudit(claim) {
  const { data: created, error: insErr } = await supabaseAdmin
    .from('site_audits')
    // A saved claim whose org tracks this site files new reports under that brand too.
    .insert({ brand_id: claim.brand_id ?? null, claim_id: claim.id, url: claim.site_url, status: 'running', rubric_version: RUBRIC_VERSION })
    .select('*')
    .single();
  if (insErr) throw insErr;

  runClaimSiteAudit(created.id, claim).catch((err) =>
    logger.error({ err, auditId: created.id, claimId: claim.id }, 'public audit background job crashed'),
  );

  return assembleAudit(created, []);
}

/**
 * Internal/MCP entry point: start an audit addressed by brand id + url.
 * Org-ownership is verified upstream in the web MCP layer; here we resolve the
 * brand's org ourselves so the quota is charged authoritatively server-side.
 * Throws a 404-status error when the brand doesn't exist.
 */
export async function startSiteAuditForBrand(brandId, url) {
  const { data: brand } = await supabaseAdmin
    .from('brands')
    .select('organization_id')
    .eq('id', brandId)
    .maybeSingle();
  if (!brand) {
    const err = new Error('Brand not found');
    err.status = 404;
    throw err;
  }
  return createAndRunAudit(brandId, url, brand.organization_id);
}

// POST /api/audits — start an audit. Returns immediately with a `running`
// row; the client polls GET /:id until it flips to completed/failed.
router.post('/', requireFeature('content_optimization'), async (req, res) => {
  const userId = req.user?.id;
  const { url, brandId } = req.body || {};

  if (!url || !brandId) {
    return res.status(400).json({ success: false, message: 'url and brandId are required' });
  }

  try {
    const { orgId } = await assertBrandAccess(brandId, userId);
    const audit = await createAndRunAudit(brandId, url, orgId);
    return res.status(202).json({ success: true, audit });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return res
        .status(err.statusCode)
        .json({ success: false, error: 'quota_exceeded', message: err.message });
    }
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    req.log.error({ err }, 'audit start failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/audits/quota — the org's monthly audit allowance (used/limit/remaining).
// Registered before /:id so "quota" isn't matched as an audit id.
router.get('/quota', async (req, res) => {
  try {
    const orgId = await getOrgIdForUser(req.user?.id);
    const quota = await getSiteAuditQuotaStatus(orgId);
    return res.json({ success: true, quota });
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return res
        .status(err.statusCode)
        .json({ success: false, error: 'quota_exceeded', message: err.message });
    }
    req.log.error({ err }, 'audit quota failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

/** Lowercased host of a URL with a leading www. stripped (null on failure). */
function normHost(u) {
  try {
    return new URL(u).host.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

// GET /api/audits/trend?brandId=… — completed audits of the brand's PRIMARY
// domain over time (score + category scores), for the hub trend chart.
// Registered before /:id so "trend" isn't matched as an audit id.
router.get('/trend', async (req, res) => {
  const userId = req.user?.id;
  const { brandId } = req.query;
  if (!brandId) {
    return res.status(400).json({ success: false, message: 'brandId is required' });
  }

  try {
    await assertBrandAccess(brandId, userId);

    const { data: domainRows } = await supabaseAdmin
      .from('brand_domains')
      .select('domain, is_primary')
      .eq('brand_id', brandId);
    const primary =
      (domainRows ?? []).find((d) => d.is_primary)?.domain ?? (domainRows ?? [])[0]?.domain ?? null;
    const primaryHost = primary
      ? primary
          .replace(/^https?:\/\//, '')
          .replace(/^www\./i, '')
          .toLowerCase()
      : null;

    const { data: rows } = await supabaseAdmin
      .from('site_audits')
      .select('id, url, final_url, total_score, category_scores, created_at')
      .eq('brand_id', brandId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })
      .limit(500);

    // Keep only audits of the primary domain (match on host of url / final_url).
    const points = (rows ?? [])
      .filter((r) => {
        if (!primaryHost) return false;
        const h = normHost(r.final_url) ?? normHost(r.url);
        return h === primaryHost;
      })
      .map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        totalScore: r.total_score === null ? null : Number(r.total_score),
        categoryScores: r.category_scores ?? {},
      }));

    return res.json({ success: true, primaryDomain: primary, points });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    req.log.error({ err }, 'audit trend failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/audits/public-claims — the signed-in user's saved public audits.
// Registered before /:id so "public-claims" isn't matched as an audit id.
router.get('/public-claims', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
  try {
    const { data: claims } = await supabaseAdmin
      .from('public_site_claims')
      .select('id, domain, site_url, verified_at, saved_at, owner_email, owner_name, brand_id')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    const ids = (claims ?? []).map((c) => c.id);
    const { data: audits } = ids.length
      ? await supabaseAdmin
          .from('site_audits')
          .select('id, claim_id, status, total_score, created_at')
          .in('claim_id', ids)
          .is('parent_audit_id', null)
          .order('created_at', { ascending: false })
      : { data: [] };
    const result = (claims ?? []).map((c) => ({
      id: c.id,
      domain: c.domain,
      siteUrl: c.site_url,
      verified: Boolean(c.verified_at),
      savedAt: c.saved_at,
      ownerEmail: c.owner_email,
      ownerName: c.owner_name,
      brandId: c.brand_id,
      audits: (audits ?? [])
        .filter((a) => a.claim_id === c.id)
        .map((a) => ({
          id: a.id,
          status: a.status,
          totalScore: a.total_score === null ? null : Number(a.total_score),
          createdAt: a.created_at,
        })),
    }));
    return res.json({ success: true, claims: result });
  } catch (err) {
    req.log.error({ err }, 'public claims list failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

/** Bare host for comparing a brand domain with an audited site ("https://www.acme.in/" → "acme.in"). */
function bareHost(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0];
}

/**
 * The signed-in user's identity for a saved report: email and name from the
 * auth user (name falls back to the profile), plus their organisation and the
 * org brand whose domain matches the audited site, if any.
 */
async function resolveClaimOwner(user, domain) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, organization_id')
    .eq('id', user.id)
    .maybeSingle();
  const name = user.user_metadata?.full_name || user.user_metadata?.name || profile?.full_name || null;
  const organizationId = profile?.organization_id ?? null;

  let brandId = null;
  if (organizationId) {
    const { data: brands } = await supabaseAdmin.from('brands').select('id').eq('organization_id', organizationId);
    const ids = (brands ?? []).map((b) => b.id);
    if (ids.length) {
      const { data: domains } = await supabaseAdmin
        .from('brand_domains')
        .select('brand_id, domain, is_primary')
        .in('brand_id', ids);
      const match = (domains ?? [])
        .filter((d) => bareHost(d.domain) === bareHost(domain))
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
      brandId = match?.brand_id ?? null;
    }
  }
  return { email: user.email ?? null, name, organizationId, brandId };
}

// POST /api/audits/public-claims/:claimId/save { marketingConsent } — attach a
// public audit claim (and its report) to the signed-in user: user id, email,
// name, organisation, and the matching brand when the org already tracks this
// site. A claim already saved by someone else stays theirs.
router.post('/public-claims/:claimId/save', async (req, res) => {
  const user = req.user;
  if (!user?.id) return res.status(401).json({ success: false, message: 'Not authenticated' });
  const { claimId } = req.params;
  try {
    const { data: claim } = await supabaseAdmin
      .from('public_site_claims')
      .select('id, domain, user_id, verified_at, marketing_consent, saved_at')
      .eq('id', claimId)
      .maybeSingle();
    if (!claim) return res.status(404).json({ success: false, message: 'Not found' });
    if (!claim.verified_at) {
      return res.status(403).json({ success: false, message: 'Verify the site before saving its report.' });
    }
    if (claim.user_id && claim.user_id !== user.id) {
      return res.status(409).json({ success: false, message: 'This report has already been saved to another account.' });
    }

    const owner = await resolveClaimOwner(user, claim.domain);
    const { error } = await supabaseAdmin
      .from('public_site_claims')
      .update({
        user_id: user.id,
        owner_email: owner.email,
        owner_name: owner.name,
        organization_id: owner.organizationId,
        brand_id: owner.brandId,
        saved_at: claim.saved_at ?? new Date().toISOString(),
        marketing_consent: Boolean(req.body?.marketingConsent) || Boolean(claim.marketing_consent),
      })
      .eq('id', claimId);
    if (error) throw error;

    // The org already tracks this site: put the site-level reports in that
    // brand's audit history too (page-level child rows stay brand-less).
    let latestAuditId = null;
    if (owner.brandId) {
      await supabaseAdmin
        .from('site_audits')
        .update({ brand_id: owner.brandId })
        .eq('claim_id', claimId)
        .is('parent_audit_id', null)
        .is('brand_id', null);
    }
    const { data: latest } = await supabaseAdmin
      .from('site_audits')
      .select('id')
      .eq('claim_id', claimId)
      .is('parent_audit_id', null)
      .order('created_at', { ascending: false })
      .limit(1);
    latestAuditId = latest?.[0]?.id ?? null;

    return res.json({
      success: true,
      owner: { email: owner.email, name: owner.name },
      brandId: owner.brandId,
      dashboardAuditId: owner.brandId ? latestAuditId : null,
    });
  } catch (err) {
    req.log.error({ err }, 'public claim save failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/audits/:id — fetch one stored audit with its signals
router.get('/:id', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const { data: audit } = await supabaseAdmin
      .from('site_audits')
      .select('*')
      .eq('id', id)
      .single();
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    await assertBrandAccess(audit.brand_id, userId);

    const { data: signalRows } = await supabaseAdmin
      .from('audit_signal_results')
      .select('*')
      .eq('audit_id', id);

    return res.json({ success: true, audit: assembleAudit(audit, signalRows ?? []) });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    req.log.error({ err }, 'audit fetch failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/audits?brandId=… — recent audits for a brand (list, no signals)
router.get('/', async (req, res) => {
  const userId = req.user?.id;
  const { brandId } = req.query;

  if (!brandId) {
    return res.status(400).json({ success: false, message: 'brandId is required' });
  }

  try {
    await assertBrandAccess(brandId, userId);

    const { data: audits } = await supabaseAdmin
      .from('site_audits')
      .select('id, url, status, total_score, signals_evaluated, signals_total, created_at')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(50);

    return res.json({ success: true, audits: audits ?? [] });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    req.log.error({ err }, 'audit list failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/audits/:id — remove an audit (signal rows cascade via FK)
router.delete('/:id', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const { data: audit } = await supabaseAdmin
      .from('site_audits')
      .select('id, brand_id')
      .eq('id', id)
      .single();
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    await assertBrandAccess(audit.brand_id, userId);

    const { error } = await supabaseAdmin.from('site_audits').delete().eq('id', id);
    if (error) throw error;

    return res.json({ success: true });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    req.log.error({ err }, 'audit delete failed');
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
