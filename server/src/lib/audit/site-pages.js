/**
 * Key-page discovery for the public AI Readiness Audit (PRD v0.3: the home
 * page plus the pages a customer or an AI assistant would look for: contact,
 * services, pricing, booking, about…).
 *
 * Reads the home page's own links first (what a visitor can actually reach),
 * then fills from sitemap.xml. Same-site HTML pages only.
 */

import * as cheerio from 'cheerio';
import { fetchViaScrapeDo, fetchText } from './fetcher.js';

/** Page kinds in priority order; first match on path or link text wins. */
export const PAGE_KINDS = [
  { label: 'Contact', re: /\b(contact|contact-us|get-in-touch|reach-us|enquir|inquir)/i },
  { label: 'Services', re: /\b(services?|treatments?|what-we-do|offerings?|solutions?|classes|courses|programs?|programmes?)\b/i },
  { label: 'Booking', re: /\b(book|booking|appointments?|schedule|reserve|reservations?)\b/i },
  { label: 'Pricing', re: /\b(pricing|prices?|fees|rates|plans|packages|tariffs?)\b/i },
  { label: 'About', re: /\b(about|about-us|our-story|who-we-are|team|artist|profile|bio|founder)\b/i },
  { label: 'Portfolio', re: /\b(portfolio|gallery|work|projects|case-studies)\b/i },
  { label: 'FAQ', re: /\b(faqs?|questions|help)\b/i },
  { label: 'Menu', re: /\b(menu|menus)\b/i },
  { label: 'Products', re: /\b(products?|shop|store|catalog(ue)?)\b/i },
  { label: 'Locations', re: /\b(locations?|branches|stores|find-us|directions)\b/i },
];

const SKIP_PATH = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4|mp3|css|js|xml|json)$|\/(wp-admin|wp-login|login|sign-?in|sign-?up|register|account|cart|checkout|privacy|terms|cookie|tag|category|author|feed)(\/|$)/i;

function sameSite(a, b) {
  return a.replace(/^www\./, '') === b.replace(/^www\./, '');
}

/** Canonical form for de-duplication: origin + path without trailing slash, no query/hash. */
function canon(u) {
  return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '') || '/'}`;
}

function kindFor(pathname, text) {
  const hay = `${decodeURIComponent(pathname)} ${text}`.toLowerCase();
  return PAGE_KINDS.find((k) => k.re.test(hay))?.label ?? null;
}

/**
 * Pick key pages from a page's links. Exported for tests.
 *
 * @param {string} html  the home page HTML
 * @param {string} homeUrl
 * @param {number} max   total pages including the home page
 * @returns {{ url: string, label: string, linkText: string }[]}
 */
export function pickKeyPagesFromHtml(html, homeUrl, max) {
  const home = new URL(homeUrl);
  const $ = cheerio.load(html);
  const seen = new Set([canon(home)]);
  const byKind = new Map();
  const others = [];

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') ?? '').trim();
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript|whatsapp|sms):/i.test(href)) return;
    let u;
    try {
      u = new URL(href, home);
    } catch {
      return;
    }
    if (!/^https?:$/.test(u.protocol) || !sameSite(u.hostname, home.hostname)) return;
    if (SKIP_PATH.test(u.pathname)) return;
    const key = canon(u);
    if (seen.has(key)) return;
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 80);
    const kind = kindFor(u.pathname, text);
    if (!kind || byKind.has(kind)) {
      if (u.pathname.split('/').filter(Boolean).length <= 2 && u.pathname !== '/' && others.length < max) {
        others.push({ url: key, label: 'Page', linkText: text });
      }
      return;
    }
    seen.add(key);
    byKind.set(kind, { url: key, label: kind, linkText: text });
  });

  const ordered = PAGE_KINDS.map((k) => byKind.get(k.label)).filter(Boolean);
  // Fill any free slots with other shallow same-site pages the home page links to.
  for (const extra of others) {
    if (ordered.length >= max - 1) break;
    if (!ordered.some((p) => p.url === extra.url)) ordered.push(extra);
  }
  return ordered.slice(0, Math.max(0, max - 1));
}

/** Shallow same-site page URLs from sitemap.xml (follows one sitemap index level). */
async function sitemapUrls(origin) {
  const xml = await fetchText(`${origin}/sitemap.xml`);
  if (!xml) return [];
  let locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
  if (/<sitemapindex/i.test(xml) && locs.length) {
    const child = await fetchText(locs[0]);
    locs = child ? [...child.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]) : [];
  }
  return locs;
}

/**
 * The pages to audit: the home page first, then up to `max - 1` key pages.
 *
 * @param {string} siteUrl  e.g. https://www.acme.in/
 * @param {{ max?: number }} [opts]
 * @returns {Promise<{ pages: { url: string, label: string, linkText: string }[], homeHtml: string|null }>}
 */
export async function discoverKeyPages(siteUrl, { max = 5 } = {}) {
  const home = { url: siteUrl, label: 'Home', linkText: '' };
  const res = await fetchViaScrapeDo(siteUrl, { render: true });
  const homeHtml = res.ok && res.html ? res.html : null;
  if (!homeHtml) return { pages: [home], homeHtml: null };

  // The home page may redirect (http → https, apex → www): resolve links against where it landed.
  const picked = pickKeyPagesFromHtml(homeHtml, siteUrl, max);

  if (picked.length < max - 1) {
    const origin = new URL(siteUrl).origin;
    const have = new Set([canon(new URL(siteUrl)), ...picked.map((p) => p.url)]);
    const kinds = new Set(picked.map((p) => p.label));
    for (const loc of await sitemapUrls(origin).catch(() => [])) {
      if (picked.length >= max - 1) break;
      let u;
      try {
        u = new URL(loc);
      } catch {
        continue;
      }
      if (!sameSite(u.hostname, new URL(siteUrl).hostname) || SKIP_PATH.test(u.pathname)) continue;
      const key = canon(u);
      const kind = kindFor(u.pathname, '') ?? 'Page';
      if ((kind !== 'Page' && kinds.has(kind)) || have.has(key) || u.pathname === '/') continue;
      if (kind === 'Page' && u.pathname.split('/').filter(Boolean).length > 2) continue;
      kinds.add(kind);
      have.add(key);
      picked.push({ url: key, label: kind, linkText: '' });
    }
  }

  return { pages: [home, ...picked], homeHtml };
}
