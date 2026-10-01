/**
 * Page fetching for the Site Audit. The target page goes through Scrape.do
 * (proxy + JS render), so we get the same HTML an AI render bot would. Small
 * auxiliary files (robots.txt, llms.txt) are fetched directly — they're public
 * by convention and not worth a Scrape.do credit each.
 */

const SCRAPEDO_API = 'https://api.scrape.do';

function getToken() {
  const token = process.env.SCRAPEDO_API_KEY;
  if (!token) throw new Error('SCRAPEDO_API_KEY must be configured');
  return token;
}

/**
 * Fetch a URL through Scrape.do and return the rendered HTML.
 *
 * @param {string} targetUrl
 * @param {{ render?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean, status: number, html: string, contentType: string|null }>}
 */
export async function fetchViaScrapeDo(targetUrl, { render = true, retries = 1 } = {}) {
  // Without a Scrape.do key (local development / self-hosting): render with a
  // local Chrome when LOCAL_RENDERER=chrome, else a plain fetch (no JS).
  if (!process.env.SCRAPEDO_API_KEY) {
    if (render && process.env.LOCAL_RENDERER === 'chrome') {
      const rendered = await fetchPageWithLocalChrome(targetUrl);
      if (rendered.ok || rendered.status) return rendered;
    }
    return fetchPageDirect(targetUrl);
  }
  const params = new URLSearchParams({ token: getToken(), url: targetUrl });
  if (render) params.set('render', 'true');
  const endpoint = `${SCRAPEDO_API}/?${params.toString()}`;

  let last = { ok: false, status: 0, html: '', contentType: null };
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(endpoint);
      const html = await res.text();
      last = { ok: res.ok, status: res.status, html, contentType: res.headers.get('content-type') };
      if (res.ok) return last;
      // 401/402/403/429 are usually Scrape.do refusing the request itself
      // (token, credits, plan or rate limit), not the site's answer. Log what
      // Scrape.do said and fall back to a direct fetch so the audit still runs.
      if ([401, 402, 403, 429].includes(res.status)) {
        console.warn(`[fetcher] Scrape.do returned ${res.status} for ${targetUrl}: ${html.slice(0, 300)}`);
        const direct = await fetchPageDirect(targetUrl);
        return direct.ok ? { ...direct, via: 'direct' } : last;
      }
      // Retry only on proxy-side 5xx (transient); other 4xx is the target's verdict.
      if (res.status < 500) return last;
    } catch (err) {
      last = { ok: false, status: 0, html: '', contentType: null, error: err.message };
    }
  }
  return last;
}

/*
 * Local Chrome renderer (no API key needed). Uses playwright-core to drive the
 * Google Chrome already installed on the machine (or CHROME_PATH), headless.
 * One browser is shared across audits and closed after a minute idle.
 */
let chromePromise = null;
let chromeIdleTimer = null;

async function getChrome() {
  if (!chromePromise) {
    chromePromise = import('playwright-core').then(({ chromium }) =>
      chromium.launch({
        headless: true,
        ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
      }),
    );
    chromePromise.catch(() => {
      chromePromise = null;
    });
  }
  return chromePromise;
}

function scheduleChromeClose() {
  clearTimeout(chromeIdleTimer);
  chromeIdleTimer = setTimeout(async () => {
    const p = chromePromise;
    chromePromise = null;
    if (p) (await p.catch(() => null))?.close().catch(() => {});
  }, 60_000);
  chromeIdleTimer.unref?.();
}

async function fetchPageWithLocalChrome(targetUrl, { timeoutMs = 30000 } = {}) {
  let context;
  try {
    const browser = await getChrome();
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 ZenticSiteAudit/1.0',
    });
    const page = await context.newPage();
    const res = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: timeoutMs }).catch(async (err) => {
      // networkidle can time out on chatty pages: keep whatever has rendered.
      if (/Timeout/i.test(err.message)) return null;
      throw err;
    });
    const html = await page.content();
    const status = res?.status() ?? 200;
    return { ok: status < 400 && Boolean(html), status, html, contentType: 'text/html', renderer: 'local-chrome' };
  } catch (err) {
    return { ok: false, status: 0, html: '', contentType: null, error: `local Chrome: ${err.message.split('\n')[0]}` };
  } finally {
    await context?.close().catch(() => {});
    scheduleChromeClose();
  }
}

/** Plain page fetch used when no Scrape.do key is configured. */
async function fetchPageDirect(targetUrl, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; ZenticSiteAudit/1.0; +https://zentic.ai)' },
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html, contentType: res.headers.get('content-type') };
  } catch (err) {
    return { ok: false, status: 0, html: '', contentType: null, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Direct fetch of a small text resource (robots.txt / llms.txt). Returns null
 * on any failure or non-2xx so the caller can decide whether to fall back.
 *
 * @param {string} url
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<string|null>}
 */
async function fetchTextDirect(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'ZenticSiteAudit/1.0 (+https://zentic.ai)' },
      redirect: 'follow',
    });
    if (res.ok) return { body: await res.text(), blocked: false };
    // 404 / 410 → the file genuinely isn't there (don't waste a proxy credit).
    // 401/403/405/406/429/503 → smells like an anti-bot block, worth a retry.
    const blocked = [401, 403, 405, 406, 429, 503].includes(res.status);
    return { body: null, blocked };
  } catch {
    // Timeout / TLS / network error — could be a block; let the caller retry.
    return { body: null, blocked: true };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a small text resource (robots.txt / llms.txt), trying a cheap direct
 * request first and falling back to Scrape.do when the site blocks us (so
 * Cloudflare-style anti-bot doesn't produce a false "absent" reading). Returns
 * null only when both paths fail.
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
export async function fetchText(url) {
  const direct = await fetchTextDirect(url);
  if (direct.body !== null) return direct.body;
  // Clean 404 → the file is genuinely absent; no point spending a proxy credit.
  if (!direct.blocked) return null;

  // Direct request looked blocked — retry through Scrape.do (no JS render
  // needed for a text file). Treat HTML error pages as "absent".
  try {
    const viaProxy = await fetchViaScrapeDo(url, { render: false, retries: 0 });
    if (!viaProxy.ok || !viaProxy.html) return null;
    if (/<html[\s>]/i.test(viaProxy.html)) return null;
    return viaProxy.html;
  } catch {
    return null;
  }
}
