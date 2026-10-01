import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/supabase.js', () => ({ default: {} }));
vi.mock('./audits.js', () => ({ assembleAudit: vi.fn(), startClaimAudit: vi.fn() }));
vi.mock('node:dns/promises', () => ({ default: { lookup: vi.fn(), resolveTxt: vi.fn() } }));

const dns = (await import('node:dns/promises')).default;
const { normalizeSite } = await import('./public-audit.js');

describe('normalizeSite', () => {
  beforeEach(() => {
    dns.lookup.mockReset();
    dns.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  it('adds https, drops the path and www for the domain', async () => {
    await expect(normalizeSite('www.Acme.in/services?x=1')).resolves.toEqual({
      domain: 'acme.in',
      siteUrl: 'https://www.acme.in/',
    });
  });

  it('keeps an explicit http scheme out of the stored site url', async () => {
    const r = await normalizeSite('http://acme.in');
    expect(r.siteUrl).toBe('https://acme.in/');
  });

  it('rejects empty, single-label, localhost and IP inputs', async () => {
    for (const bad of ['', '   ', 'acme', 'localhost', 'http://127.0.0.1', '10.0.0.5', 'printer.local']) {
      const r = await normalizeSite(bad);
      expect(r.error, bad).toBeTruthy();
    }
  });

  it('rejects hosts that resolve to a private network', async () => {
    dns.lookup.mockResolvedValue([{ address: '192.168.1.10', family: 4 }]);
    const r = await normalizeSite('intranet.acme.in');
    expect(r.error).toMatch(/public websites/);
  });

  it('explains when the domain does not resolve', async () => {
    dns.lookup.mockRejectedValue(new Error('ENOTFOUND'));
    const r = await normalizeSite('no-such-site-zentic.in');
    expect(r.error).toMatch(/couldn’t find/);
  });
});
