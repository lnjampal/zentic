/**
 * Ready-to-paste fixes built from the site's own pages, with no LLM call.
 *
 * The LLM recommendation pass (recommendations.js) covers content signals when
 * an AI provider is configured. These cover the site-level, mechanical ones a
 * small-business owner most often needs and an LLM adds nothing to: robots.txt
 * rules for AI crawlers, an llms.txt draft, business JSON-LD, social meta tags
 * and the viewport/canonical tags. Every value comes from the crawled HTML;
 * anything we can't read is left as a clearly marked [PLACEHOLDER].
 */

import * as cheerio from 'cheerio';

const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'];

const SOCIAL = /(facebook|instagram|linkedin|twitter|x\.com|youtube|tiktok|pinterest|threads)\./i;

function clean(s, max = 300) {
  return (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Facts about the business read from the home page HTML. Exported for tests. */
export function readBusinessFacts(homeHtml, homeUrl) {
  const $ = cheerio.load(homeHtml ?? '');
  const meta = (sel) => clean($(sel).attr('content'));
  const title = clean($('title').first().text(), 120);
  const siteName = meta('meta[property="og:site_name"]') || title.split(/\s[|\-–—:]\s/)[0] || new URL(homeUrl).hostname.replace(/^www\./, '');
  const description = meta('meta[name="description"]') || meta('meta[property="og:description"]');
  const image = meta('meta[property="og:image"]');
  const tel = clean(($('a[href^="tel:"]').first().attr('href') ?? '').replace(/^tel:/i, ''), 40);
  const email = clean(($('a[href^="mailto:"]').first().attr('href') ?? '').replace(/^mailto:/i, '').split('?')[0], 120);
  const sameAs = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (/^https?:\/\//i.test(href) && SOCIAL.test(href) && !sameAs.includes(href) && sameAs.length < 6) sameAs.push(href.split('?')[0]);
  });
  return { siteName, title, description, image, tel, email, sameAs };
}

function robotsFix(robotsTxt) {
  const lines = AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n');
  const blocked = robotsTxt
    ? AI_BOTS.filter((b) => new RegExp(`user-agent:\\s*${b}[\\s\\S]*?disallow:\\s*/\\s*$`, 'im').test(robotsTxt))
    : [];
  const note = blocked.length
    ? `Your robots.txt currently blocks ${blocked.join(', ')}. Remove those "Disallow: /" lines and add the rules below.`
    : 'Add these rules to the robots.txt file at your site root (create the file if there is none).';
  return { recommendation: note, draft: lines };
}

function llmsFix(facts, pages, origin) {
  const pageLines = pages
    .map((p) => `- [${p.label === 'Home' ? facts.siteName : p.linkText || p.label}](${p.url}): ${p.label === 'Home' ? 'Home page' : `${p.label} page`}`)
    .join('\n');
  const draft = [
    `# ${facts.siteName}`,
    '',
    `> ${facts.description || '[ONE OR TWO SENTENCES ON WHAT YOUR BUSINESS DOES, FOR WHOM, AND WHERE]'}`,
    '',
    '## Key pages',
    '',
    pageLines,
    '',
    '## Contact',
    '',
    `- Website: ${origin}`,
    facts.tel ? `- Phone: ${facts.tel}` : '- Phone: [YOUR PHONE]',
    facts.email ? `- Email: ${facts.email}` : '- Email: [YOUR EMAIL]',
  ].join('\n');
  return {
    recommendation: `Save this as llms.txt at ${origin}/llms.txt. Check the summary line and fill any [PLACEHOLDER] before publishing.`,
    draft,
  };
}

function businessJsonLd(facts, origin) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: facts.siteName,
    url: `${origin}/`,
    description: facts.description || '[WHAT YOUR BUSINESS DOES]',
    ...(facts.image ? { image: facts.image } : {}),
    telephone: facts.tel || '[YOUR PHONE]',
    ...(facts.email ? { email: facts.email } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: '[STREET ADDRESS]',
      addressLocality: '[CITY]',
      postalCode: '[POSTCODE]',
      addressCountry: '[COUNTRY CODE, e.g. IN]',
    },
    openingHours: '[e.g. Mo-Sa 09:00-19:00]',
    ...(facts.sameAs.length ? { sameAs: facts.sameAs } : {}),
  };
  return {
    recommendation:
      'Paste this inside the <head> of your home page. Replace "LocalBusiness" with the closest specific type if there is one (for example HairSalon, Restaurant, Dentist or Store) and fill every [PLACEHOLDER].',
    draft: `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`,
  };
}

function socialTags(facts, origin) {
  const t = facts.title || facts.siteName;
  const d = facts.description || '[ONE-SENTENCE DESCRIPTION]';
  const img = facts.image || '[URL OF A 1200×630 IMAGE]';
  return [
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:url" content="${origin}/">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${img}">`,
  ].join('\n');
}

/**
 * Deterministic recommendations for failing site-level signals.
 *
 * @param {{ signals: { key: string, status: string }[], homeHtml: string|null, homeUrl: string, pages: { url: string, label: string, linkText: string }[], robotsTxt: string|null }} input
 * @returns {{ signalKey: string, label: string, category: string, priority: 'high'|'medium'|'low', recommendation: string, draft: string, source: 'site' }[]}
 */
export function buildSiteFixes({ signals, homeHtml, homeUrl, pages, robotsTxt, labels = {} }) {
  const failing = new Set(signals.filter((s) => s.status === 'fail' || s.status === 'warn').map((s) => s.key));
  const origin = new URL(homeUrl).origin;
  const facts = readBusinessFacts(homeHtml, homeUrl);
  const out = [];
  const add = (signalKey, category, priority, fix) =>
    out.push({ signalKey, label: labels[signalKey] ?? signalKey, category, priority, ...fix, source: 'site' });

  if (failing.has('ai-bot-access')) add('ai-bot-access', 'trust', 'high', robotsFix(robotsTxt));
  if (failing.has('llms-txt-presence')) add('llms-txt-presence', 'trust', 'medium', llmsFix(facts, pages, origin));
  if (failing.has('json-ld-presence') || failing.has('json-ld-relevance')) {
    const key = failing.has('json-ld-presence') ? 'json-ld-presence' : 'json-ld-relevance';
    add(key, 'structure', 'high', businessJsonLd(facts, origin));
  }
  if (failing.has('open-graph') || failing.has('twitter-card')) {
    const key = failing.has('open-graph') ? 'open-graph' : 'twitter-card';
    add(key, 'structure', 'medium', {
      recommendation: 'Paste these tags inside the <head> of each key page, with that page’s own title and description.',
      draft: socialTags(facts, origin),
    });
  }
  if (failing.has('viewport')) {
    add('viewport', 'trust', 'low', {
      recommendation: 'Paste this inside the <head> of every page so phones and AI renderers see the mobile layout.',
      draft: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    });
  }
  if (failing.has('canonical')) {
    add('canonical', 'trust', 'low', {
      recommendation: 'Add a self-referencing canonical tag inside the <head> of each page, with that page’s own address.',
      draft: pages.map((p) => `<!-- ${p.label} -->\n<link rel="canonical" href="${p.url}">`).join('\n'),
    });
  }
  return out;
}
