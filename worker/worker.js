/**
 * FRMM Yahoo Finance proxy for Cloudflare Workers (free plan is plenty).
 *
 * Why it exists: Yahoo has no public API key and its servers refuse requests made straight
 * from a web page (no CORS). This small Worker asks Yahoo on the site's behalf, trims the answer
 * to what FRMM needs, caches it for a minute, and only talks to the sites you allow below.
 *
 *   GET /q?s=AZN.L,SHEL.L,^FTSE      up to 25 symbols: price, change today, change over a month, sparkline
 *   GET /c?s=^FTSE&r=1D|1W|1M|3M|1Y  one symbol's chart, at most 240 points
 *
 * This uses Yahoo's unofficial chart endpoint. It is free and delayed, it has no promise of staying
 * up, and Yahoo's terms limit it to personal use. See README.md.
 */

const DEFAULT_ORIGINS = ['https://fahduk.github.io', 'https://fahd.uk', 'https://www.fahd.uk'];
const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
const SYMBOL = /^[A-Za-z0-9^.=\-]{1,20}$/;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const RANGES = { '1D': ['1d', '5m'], '1W': ['5d', '30m'], '1M': ['1mo', '1d'], '3M': ['3mo', '1d'], '1Y': ['1y', '1d'] };
const MAX_SYMBOLS = 25;

function allowedOrigins(env) {
  const extra = env && env.ALLOWED_ORIGINS ? String(env.ALLOWED_ORIGINS).split(',').map((s) => s.trim()).filter(Boolean) : [];
  return DEFAULT_ORIGINS.concat(extra);
}
function originOk(origin, env) {
  if (!origin) return true; // direct visits and health checks
  if (allowedOrigins(env).includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
function cors(origin) {
  return { 'Access-Control-Allow-Origin': origin || '*', 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400' };
}
function json(body, status, origin, maxAge) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': maxAge ? 'public, max-age=' + maxAge : 'no-store' }, cors(origin)),
  });
}

async function yahooChart(symbol, range, interval) {
  let lastErr;
  for (const host of HOSTS) {
    try {
      const url = 'https://' + host + '/v8/finance/chart/' + encodeURIComponent(symbol) + '?range=' + range + '&interval=' + interval + '&includePrePost=false';
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, cf: { cacheTtl: 30, cacheEverything: true } });
      if (!res.ok) { lastErr = new Error('Yahoo ' + res.status); continue; }
      const data = await res.json();
      const r = data && data.chart && data.chart.result && data.chart.result[0];
      if (!r) { lastErr = new Error('no result'); continue; }
      return r;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('failed');
}

/* keep only points that have a close */
function points(r) {
  const ts = r.timestamp || [];
  const cl = (r.indicators && r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || [];
  const out = [];
  for (let i = 0; i < ts.length; i++) if (cl[i] != null && isFinite(cl[i])) out.push({ t: ts[i], c: cl[i] });
  return out;
}
const round = (n, dp) => Math.round(n * Math.pow(10, dp)) / Math.pow(10, dp);

/* price, today's move against the previous daily close, one-month move, a small sparkline */
function quote(r) {
  const meta = r.meta || {};
  const pts = points(r);
  const p = meta.regularMarketPrice != null ? meta.regularMarketPrice : pts.length ? pts[pts.length - 1].c : null;
  if (p == null || !pts.length) return null;
  const off = meta.gmtoffset || 0;
  const day = (t) => Math.floor((t + off) / 86400);
  const last = pts[pts.length - 1];
  const todayInSeries = meta.regularMarketTime != null && day(last.t) === day(meta.regularMarketTime);
  const prev = todayInSeries ? (pts.length > 1 ? pts[pts.length - 2].c : null) : last.c;
  const c = prev ? (p / prev - 1) * 100 : 0;
  const m = (p / pts[0].c - 1) * 100;
  const s = pts.slice(-22).map((x) => round(x.c, 4));
  if (todayInSeries) s[s.length - 1] = round(p, 4);
  return { p: round(p, 6), c: round(c, 2), m: round(m, 2), s, cur: meta.currency || null };
}

function downsample(pts, max) {
  if (pts.length <= max) return pts;
  const step = pts.length / max, out = [];
  for (let i = 0; i < max; i++) out.push(pts[Math.floor(i * step)]);
  out[out.length - 1] = pts[pts.length - 1];
  return out;
}

async function handleQuotes(url) {
  const syms = (url.searchParams.get('s') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!syms.length || syms.length > MAX_SYMBOLS) return { status: 400, body: { error: 'Send between 1 and ' + MAX_SYMBOLS + ' symbols in s=' } };
  if (!syms.every((s) => SYMBOL.test(s))) return { status: 400, body: { error: 'Bad symbol' } };
  const out = {};
  await Promise.all(syms.map(async (s) => {
    try { out[s] = quote(await yahooChart(s, '1mo', '1d')); } catch (e) { out[s] = null; }
  }));
  return { status: 200, body: out, ttl: 60 };
}

async function handleChart(url) {
  const s = (url.searchParams.get('s') || '').trim();
  const rk = (url.searchParams.get('r') || '1M').toUpperCase();
  if (!SYMBOL.test(s) || !RANGES[rk]) return { status: 400, body: { error: 'Bad symbol or range' } };
  try {
    const r = await yahooChart(s, RANGES[rk][0], RANGES[rk][1]);
    const pts = downsample(points(r), 240);
    if (pts.length < 2) return { status: 502, body: { error: 'No data' } };
    return { status: 200, body: { t: pts.map((x) => x.t * 1000), v: pts.map((x) => round(x.c, 4)) }, ttl: rk === '1D' ? 120 : 300 };
  } catch (e) { return { status: 502, body: { error: 'Upstream failed' } }; }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
    if (!originOk(origin, env)) return json({ error: 'Origin not allowed' }, 403, null);

    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/health') return json({ ok: true, service: 'frmm-yahoo' }, 200, origin);
    if (url.pathname !== '/q' && url.pathname !== '/c') return json({ error: 'Not found' }, 404, origin);

    /* normalise the cache key so ordering of parameters does not matter, and origin never splits it */
    const key = new URL(url.origin + url.pathname);
    key.searchParams.set('s', (url.searchParams.get('s') || '').split(',').map((x) => x.trim()).sort().join(','));
    if (url.pathname === '/c') key.searchParams.set('r', (url.searchParams.get('r') || '1M').toUpperCase());
    const cacheKey = new Request(key.toString());
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    if (cache) {
      const hit = await cache.match(cacheKey);
      if (hit) return new Response(hit.body, { status: 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30', 'X-Cache': 'HIT' }, cors(origin)) });
    }

    const res = url.pathname === '/q' ? await handleQuotes(url) : await handleChart(url);
    const response = json(res.body, res.status, origin, res.ttl);
    if (cache && res.status === 200 && ctx) {
      const store = new Response(JSON.stringify(res.body), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=' + res.ttl } });
      ctx.waitUntil(cache.put(cacheKey, store));
    }
    return response;
  },
};
