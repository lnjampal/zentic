import { describe, it, expect } from 'vitest';
import { pickKeyPagesFromHtml } from './site-pages.js';
import { buildSiteFixes, readBusinessFacts } from './site-fixes.js';

const HOME = `<html><head><title>Lotus Yoga | Bengaluru</title><meta name="description" content="Yoga classes in Indiranagar.">
<meta property="og:image" content="https://lotus.in/og.jpg"></head><body>
<a href="/">Home</a><a href="/about-us/">About us</a><a href="/classes">Our classes</a><a href="/pricing?ref=nav">Pricing</a>
<a href="https://www.lotus.in/contact">Contact</a><a href="/book-a-trial">Book a free trial</a><a href="/faq">FAQ</a>
<a href="/blog/2024/10/post">Blog post</a><a href="/privacy">Privacy</a><a href="mailto:hi@lotus.in">Email</a>
<a href="tel:+919876543210">Call</a><a href="https://instagram.com/lotusyoga">Instagram</a><a href="https://other.com/contact">Other</a>
<a href="/brochure.pdf">Brochure</a></body></html>`;

describe('pickKeyPagesFromHtml', () => {
  it('picks one page per kind, same site only, in priority order, capped', () => {
    const pages = pickKeyPagesFromHtml(HOME, 'https://lotus.in/', 5);
    expect(pages.map((p) => p.label)).toEqual(['Contact', 'Services', 'Booking', 'Pricing']);
    expect(pages[0].url).toBe('https://www.lotus.in/contact');
    expect(pages[3].url).toBe('https://lotus.in/pricing');
  });

  it('returns nothing when the cap leaves no room beyond home', () => {
    expect(pickKeyPagesFromHtml(HOME, 'https://lotus.in/', 1)).toEqual([]);
  });
});

describe('site fixes', () => {
  const pages = [{ url: 'https://lotus.in/', label: 'Home', linkText: '' }, { url: 'https://lotus.in/contact', label: 'Contact', linkText: 'Contact' }];

  it('reads business facts from the home page', () => {
    const f = readBusinessFacts(HOME, 'https://lotus.in/');
    expect(f.siteName).toBe('Lotus Yoga');
    expect(f.description).toBe('Yoga classes in Indiranagar.');
    expect(f.tel).toBe('+919876543210');
    expect(f.email).toBe('hi@lotus.in');
    expect(f.sameAs).toEqual(['https://instagram.com/lotusyoga']);
  });

  it('builds drafts only for failing site-level signals', () => {
    const fixes = buildSiteFixes({
      signals: [
        { key: 'ai-bot-access', status: 'fail' },
        { key: 'llms-txt-presence', status: 'fail' },
        { key: 'json-ld-presence', status: 'fail' },
        { key: 'viewport', status: 'pass' },
      ],
      homeHtml: HOME,
      homeUrl: 'https://lotus.in/',
      pages,
      robotsTxt: 'User-agent: GPTBot\nDisallow: /\n',
    });
    expect(fixes.map((f) => f.signalKey)).toEqual(['ai-bot-access', 'llms-txt-presence', 'json-ld-presence']);
    expect(fixes[0].recommendation).toMatch(/currently blocks GPTBot/);
    expect(fixes[1].draft).toContain('# Lotus Yoga');
    expect(fixes[1].draft).toContain('[Contact](https://lotus.in/contact)');
    const jsonLd = JSON.parse(fixes[2].draft.replace(/<\/?script[^>]*>/g, ''));
    expect(jsonLd['@type']).toBe('LocalBusiness');
    expect(jsonLd.telephone).toBe('+919876543210');
  });
});
