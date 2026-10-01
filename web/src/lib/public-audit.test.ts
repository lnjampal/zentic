import { describe, it, expect } from 'vitest';
import { points, rankFixes, readinessBand } from './public-audit';
import type { AuditResult, AuditSignal } from '@/lib/actions/audits';

function signal(key: string, status: AuditSignal['status'], impactTier: AuditSignal['impactTier'], score = 0): AuditSignal {
  return { key, category: 'trust', status, score, evidence: {}, label: key, what: null, why: null, howToFix: `fix ${key}`, impactTier };
}

function audit(signals: AuditSignal[]): AuditResult {
  return {
    id: 'a', brandId: null, url: 'https://acme.in/', finalUrl: null, status: 'completed', totalScore: 0.5,
    categoryScores: {}, signalsEvaluated: signals.length, signalsTotal: 47, rubricVersion: 'v1', error: null,
    createdAt: '2026-10-01T00:00:00Z', completedAt: null, signals,
    recommendations: [{ signalKey: 'faq', label: 'faq', category: null, priority: 'high', recommendation: 'Add FAQ', draft: '{}' }],
  };
}

describe('readinessBand / points', () => {
  it('maps scores to the PRD bands', () => {
    expect(readinessBand(null)).toBeNull();
    expect(readinessBand(0.39)).toBe('Not ready');
    expect(readinessBand(0.4)).toBe('Partly ready');
    expect(readinessBand(0.69)).toBe('Partly ready');
    expect(readinessBand(0.7)).toBe('Ready');
    expect(points(0.546)).toBe(55);
    expect(points(null)).toBeNull();
  });
});

describe('rankFixes', () => {
  it('keeps only failing and warning signals, high impact and failures first', () => {
    const ranked = rankFixes(
      audit([
        signal('pass-one', 'pass', 'high'),
        signal('na-one', 'na', 'high'),
        signal('std-fail', 'fail', 'standard'),
        signal('high-warn', 'warn', 'high', 0.5),
        signal('high-fail', 'fail', 'high', 0),
        signal('faq', 'fail', 'medium'),
      ]),
    );
    expect(ranked.map((f) => f.signal.key)).toEqual(['high-fail', 'high-warn', 'faq', 'std-fail']);
    expect(ranked[0].impact).toBe('High');
    expect(ranked[2].recommendation?.recommendation).toBe('Add FAQ');
    expect(ranked[3].impact).toBe('Low');
  });
});
