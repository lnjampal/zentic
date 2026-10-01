import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchViaScrapeDo } from './fetcher.js';

function res(status, body) {
  return { ok: status >= 200 && status < 300, status, text: async () => body, headers: { get: () => 'text/html' } };
}

describe('fetchViaScrapeDo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('falls back to a direct fetch when Scrape.do refuses the request', async () => {
    vi.stubEnv('SCRAPEDO_API_KEY', 'tok');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(res(401, '{"Message":["Invalid token"]}'))
      .mockResolvedValueOnce(res(200, '<html>ok</html>'));
    vi.stubGlobal('fetch', fetchMock);
    const page = await fetchViaScrapeDo('https://example.com/');
    expect(page).toMatchObject({ ok: true, status: 200, html: '<html>ok</html>', via: 'direct' });
    expect(fetchMock.mock.calls[1][0]).toBe('https://example.com/');
  });

  it('keeps the Scrape.do result when the direct fetch also fails', async () => {
    vi.stubEnv('SCRAPEDO_API_KEY', 'tok');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(res(403, 'nope')).mockResolvedValueOnce(res(403, 'blocked')));
    const page = await fetchViaScrapeDo('https://example.com/');
    expect(page).toMatchObject({ ok: false, status: 403, html: 'nope' });
  });

  it('returns a target 404 as is', async () => {
    vi.stubEnv('SCRAPEDO_API_KEY', 'tok');
    const fetchMock = vi.fn().mockResolvedValueOnce(res(404, 'missing'));
    vi.stubGlobal('fetch', fetchMock);
    const page = await fetchViaScrapeDo('https://example.com/');
    expect(page.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
