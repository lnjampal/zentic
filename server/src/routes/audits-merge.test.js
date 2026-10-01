import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/supabase.js', () => ({ default: {} }));
const { mergePageSignals } = await import('./audits.js');

describe('mergePageSignals', () => {
  it('takes the worst status, averages applied scores and lists pages', () => {
    const merged = mergePageSignals([
      { page: { url: 'https://a.in/', label: 'Home' }, signals: [{ signal_key: 'h1', category: 'structure', status: 'pass', score: 1, evidence: { h: 1 } }, { signal_key: 'faq', category: 'structure', status: 'na', score: null }] },
      { page: { url: 'https://a.in/contact', label: 'Contact' }, signals: [{ signal_key: 'h1', category: 'structure', status: 'fail', score: 0 }, { signal_key: 'faq', category: 'structure', status: 'warn', score: 0.5 }] },
    ]);
    const h1 = merged.find((m) => m.key === 'h1');
    expect(h1.status).toBe('fail');
    expect(h1.score).toBe(0.5);
    expect(h1.evidence.pages.map((p) => p.status)).toEqual(['pass', 'fail']);
    expect(h1.evidence.home).toEqual({ h: 1 });
    const faq = merged.find((m) => m.key === 'faq');
    expect(faq.status).toBe('warn');
    expect(faq.score).toBe(0.5);
  });
});
