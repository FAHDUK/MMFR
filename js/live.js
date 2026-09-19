/* FRMM live data.
   Shares and indices: Yahoo Finance, through your own Cloudflare Worker (worker/worker.js).
   Crypto: CoinGecko. Currencies: Frankfurter (European Central Bank rates).
   Headlines: public RSS feeds via rss2json.
   With no WORKER_URL, or if a call fails, it falls back to demo numbers and says so on screen. */
(function () {
  'use strict';
  var F = window.FRMM, MK = F.MK, hash = F.hash, rng = F.rng, gauss = F.gauss;
  var W = (F.CONFIG.WORKER_URL || '').replace(/\/+$/, '');
  var DAY = new Date().toISOString().slice(0, 10);

  F.updated = null;               /* Date of the last successful live refresh */
  F.onData = null;                /* set by the views: called with a market key after new numbers arrive */
  F.fx = {};
  var inflight = {}, loadedAt = {};

  /* ---------- flash bookkeeping ---------- */
  function setPx(c, v) {
    c.pp = c.px;
    c.px = v;
    c.fl = (c.pp != null && v != null && c.pp !== v) ? (v > c.pp ? 1 : -1) : 0;
  }

  /* ---------- demo numbers: repeatable per day, so a refresh does not reshuffle everything ---------- */
  function demoIdx(k) {
    var m = MK[k];
    m.idx.forEach(function (x, i) {
      var r = rng(hash('ix' + k + x.sym + DAY));
      if (x.v0 == null) x.v0 = x.val;
      x.ok = true; x.chg = +(gauss(r) * m.sd * 0.6 + 0.15).toFixed(2);
      x.pp = null; x.val = x.v0 * (1 + x.chg / 100); x.fl = 0;
      x.sp = F.series('ixs' + k + i + DAY, 30, x.chg * 3 + 1, 0.018);
    });
  }
  function demoMarket(k) {
    var m = MK[k];
    m.cos.forEach(function (c) {
      var r = rng(hash(k + c.ys + DAY)), chg = +(gauss(r) * m.sd).toFixed(2);
      if (c.px0 == null) c.px0 = c.px;
      c.ok = true; c.chg = chg; c.m1 = +(gauss(r) * 4 + 0.6).toFixed(1);
      c.pp = null; c.px = c.px0 * (1 + chg / 100); c.fl = 0;
      c.sp = F.series(k + c.ys + DAY, 22, c.m1 * 0.9, 0.02);
      if (k === 'crypto') c.cap = null;
    });
    demoIdx(k);
    m.have = 'demo';
  }

  /* small random moves so the trading floor feels alive in demo mode */
  F.tickDemo = function (k, n) {
    var m = MK[k], list = m.cos.filter(function (c) { return c.ok; }), i, changed = [];
    m.cos.forEach(function (c) { c.fl = 0; });
    for (i = 0; i < n; i++) {
      var c = list[Math.floor(Math.random() * list.length)]; if (!c) continue;
      var mv = (Math.random() - .48) * .0055, prevClose = c.px / (1 + c.chg / 100), nx = c.px * (1 + mv);
      c.pp = c.px; c.px = nx; c.fl = mv >= 0 ? 1 : -1; c.chg = +((nx / prevClose - 1) * 100).toFixed(2); changed.push(c);
    }
    var ix = m.idx[0]; ix.pp = ix.val; var mv2 = (Math.random() - .5) * .0012; ix.val *= 1 + mv2; ix.chg = +(ix.chg + mv2 * 100).toFixed(2); ix.fl = mv2 >= 0 ? 1 : -1;
    return changed;
  };

  /* ---------- Yahoo through the Worker ---------- */
  function workerQuote(syms) {
    var chunks = [], i;
    for (i = 0; i < syms.length; i += 25) chunks.push(syms.slice(i, i + 25));
    return Promise.all(chunks.map(function (ch) { return F.getJSON(W + '/q?s=' + encodeURIComponent(ch.join(',')), 15000); })).then(function (parts) {
      var out = {}; parts.forEach(function (p) { Object.keys(p || {}).forEach(function (s) { out[s] = p[s]; }); });
      return out;
    });
  }
  function applyQuotes(k, q) {
    var m = MK[k], got = 0;
    function one(o, r) {
      if (r && r.p != null && !isNaN(r.p)) { o.ok = true; got++; return true; }
      o.ok = false; return false;
    }
    m.cos.forEach(function (c) {
      var r = q[c.ys]; if (!one(c, r)) return;
      setPx(c, r.p); c.chg = r.c; c.m1 = r.m; c.sp = r.s || null;
    });
    m.idx.forEach(function (x) {
      var r = q[x.sym]; if (!one(x, r)) return;
      x.pp = x.val; x.val = r.p; x.fl = x.pp !== x.val ? (x.val > x.pp ? 1 : -1) : 0; x.chg = r.c; x.sp = r.s || null;
    });
    return got;
  }

  /* ---------- CoinGecko ---------- */
  var CG = 'https://api.coingecko.com/api/v3/';
  function applyCoins(rows) {
    var m = MK.crypto, by = {}, got = 0;
    rows.forEach(function (r) { by[r.id] = r; });
    m.cos.forEach(function (c) {
      var r = by[c.id]; if (!r || r.current_price == null) { c.ok = false; return; }
      c.ok = true; got++;
      setPx(c, r.current_price); c.chg = r.price_change_percentage_24h == null ? 0 : +r.price_change_percentage_24h.toFixed(2);
      c.m1 = r.price_change_percentage_30d_in_currency == null ? null : +r.price_change_percentage_30d_in_currency.toFixed(1);
      c.cap = r.market_cap ? r.market_cap / 1e9 : null;
      var s = r.sparkline_in_7d && r.sparkline_in_7d.price; c.sp = s ? s.filter(function (_, i) { return i % 6 === 0; }) : null;
      c.mrank = r.market_cap_rank;
    });
    m.cos.sort(function (a, b) { return (b.cap || 0) - (a.cap || 0); }).forEach(function (c, i) { c.rank = i + 1; });
    m.idx.forEach(function (x) {
      var r = by[x.sym]; if (!r) { x.ok = false; return; }
      x.ok = true; x.pp = x.val; x.val = r.current_price; x.fl = x.pp !== x.val ? (x.val > x.pp ? 1 : -1) : 0;
      x.chg = r.price_change_percentage_24h == null ? 0 : +r.price_change_percentage_24h.toFixed(2);
      var s = r.sparkline_in_7d && r.sparkline_in_7d.price; x.sp = s ? s.filter(function (_, i) { return i % 6 === 0; }) : null;
    });
    return got;
  }
  function loadCrypto() {
    return F.getJSON(CG + 'coins/markets?vs_currency=gbp&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,30d', 15000)
      .then(function (rows) { var n = applyCoins(rows); if (!n) throw new Error('empty'); F.cache.set('cg', rows); return true; })
      .catch(function () {
        var c = F.cache.get('cg', 6 * 3600 * 1000);
        if (c) { applyCoins(c); return true; }
        return false;
      });
  }

  /* ---------- one market ---------- */
  F.isLive = function (k) { return MK[k].have === 'live'; };
  F.loadMarket = function (k, force) {
    var m = MK[k], p;
    if (inflight[k]) return inflight[k];
    if (!force && loadedAt[k] && Date.now() - loadedAt[k] < 20000) return Promise.resolve();
    if (k === 'crypto') p = loadCrypto();
    else if (W) {
      var syms = m.cos.map(function (c) { return c.ys; }).concat(m.idx.map(function (x) { return x.sym; }));
      p = workerQuote(syms).then(function (q) { if (!applyQuotes(k, q)) throw new Error('no quotes'); return true; }).catch(function () { return false; });
    } else p = Promise.resolve(false);
    inflight[k] = p.then(function (live) {
      delete inflight[k]; loadedAt[k] = Date.now();
      if (live) { m.have = 'live'; F.updated = new Date(); }
      else if (!m.have) demoMarket(k);
      if (F.onData) F.onData(k);
    });
    return inflight[k];
  };
  /* index values for every region, for the top strip and the home page */
  F.loadIndices = function () {
    var ks = ['uk', 'us', 'europe', 'asia'], syms = [];
    ks.forEach(function (k) { if (MK[k].idx[0].chg == null) demoIdx(k); MK[k].idx.forEach(function (x) { syms.push(x.sym); }); });
    if (!W) return Promise.resolve();
    return workerQuote(syms).then(function (q) {
      ks.forEach(function (k) {
        if (MK[k].have === 'live') return;
        MK[k].idx.forEach(function (x) { var r = q[x.sym]; if (r && r.p != null) { x.ok = true; x.pp = x.val; x.val = r.p; x.chg = r.c; x.sp = r.s || null; x.fl = 0; x.live = true; } else x.ok = false; });
      });
      F.updated = new Date();
    }).catch(function () { /* stay on demo */ }).then(function () { if (F.onData) F.onData('indices'); });
  };

  /* ---------- currency conversions ---------- */
  function isoDaysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
  function demoFx(k) {
    var c = F.CONV[k], rows = c.to.map(function (t) {
      var r = rng(hash('cv' + k + t + DAY)), pc = +(gauss(r) * 0.3).toFixed(2);
      return { to: t, v: c.amt * F.DEMO_RATE[t] / F.DEMO_RATE[c.base], chg: pc, sp: F.series('cvs' + k + t, 24, pc * 2, 0.01) };
    });
    return { rows: rows, live: false };
  }
  F.loadFx = function (k) {
    var c = F.CONV[k]; if (c.crypto) return Promise.resolve();
    if (!F.fx[k]) F.fx[k] = demoFx(k);
    var cached = F.cache.get('fx.' + k, 20 * 60 * 1000);
    if (cached) { F.fx[k] = cached; if (F.onData) F.onData('fx'); return Promise.resolve(); }
    return F.getJSON('https://api.frankfurter.dev/v1/' + isoDaysAgo(45) + '..?base=' + c.base + '&symbols=' + c.to.join(','), 12000).then(function (d) {
      var days = Object.keys(d.rates || {}).sort();
      if (days.length < 2) throw new Error('short');
      var rows = c.to.map(function (t) {
        var series = days.map(function (dt) { return d.rates[dt][t]; }).filter(function (v) { return v != null; });
        var last = series[series.length - 1], prev = series[series.length - 2];
        return { to: t, v: last * c.amt, chg: +((last / prev - 1) * 100).toFixed(2), sp: series.slice(-24) };
      });
      F.fx[k] = { rows: rows, live: true }; F.cache.set('fx.' + k, F.fx[k]);
    }).catch(function () { /* keep demo rates */ }).then(function () { if (F.onData) F.onData('fx'); });
  };
  /* rows for the conversion strip; the crypto one is worked out from the coin prices */
  F.convRows = function (k) {
    var c = F.CONV[k];
    if (!c.crypto) return F.fx[k] || (F.fx[k] = demoFx(k));
    var by = {}; MK.crypto.cos.forEach(function (x) { by[x.t] = x; });
    var b = by.BTC;
    return {
      live: F.isLive('crypto'), rows: c.to.map(function (t) {
        var o = by[t]; if (!b || !o || !b.ok || !o.ok) return { to: t, v: NaN, chg: null, sp: null };
        var sp = null;
        if (b.sp && o.sp && b.sp.length === o.sp.length) sp = b.sp.map(function (v, i) { return v / o.sp[i]; });
        return { to: t, v: c.amt * b.px / o.px, chg: +(((1 + b.chg / 100) / (1 + o.chg / 100) - 1) * 100).toFixed(2), sp: sp };
      })
    };
  };

  /* ---------- index and coin charts ---------- */
  var RANGES = { '1D': [1, 48, 1], '1W': [7, 42, 2], '1M': [30, 30, 4], '3M': [90, 60, 7], '1Y': [365, 120, 14] };
  var chartCache = {};
  F.chart = function (k, i, range) {
    var m = MK[k], x = m.idx[i], key = k + '|' + x.sym + '|' + range;
    var hit = chartCache[key]; if (hit && Date.now() - hit.at < 5 * 60 * 1000) return Promise.resolve(hit.d);
    function done(d) { chartCache[key] = { at: Date.now(), d: d }; return d; }
    function demo() {
      var cfg = RANGES[range], r = rng(hash('dk' + k + x.sym + range + DAY)), end = range === '1D' ? x.chg : (r() - .4) * cfg[2] * 1.5;
      var s = F.series('dc' + k + x.sym + range, cfg[1], end, range === '1D' ? .008 : .012), last = s[s.length - 1], now = Date.now(), span = cfg[0] * 86400000;
      return { demo: true, t: s.map(function (_, j) { return now - span + j / (cfg[1] - 1) * span; }), v: s.map(function (v) { return v / last * x.val; }) };
    }
    if (k === 'crypto') {
      if (!F.isLive('crypto')) return Promise.resolve(demo());
      return F.getJSON(CG + 'coins/' + x.sym + '/market_chart?vs_currency=gbp&days=' + RANGES[range][0], 15000).then(function (d) {
        var p = d.prices || [], step = Math.max(1, Math.ceil(p.length / 240)), t = [], v = [];
        p.forEach(function (row, j) { if (j % step === 0 || j === p.length - 1) { t.push(row[0]); v.push(row[1]); } });
        if (v.length < 2) throw new Error('short');
        return done({ t: t, v: v });
      }).catch(function () { return demo(); });
    }
    if (!W) return Promise.resolve(demo());
    return F.getJSON(W + '/c?s=' + encodeURIComponent(x.sym) + '&r=' + range, 15000).then(function (d) {
      if (!d || !d.v || d.v.length < 2) throw new Error('short');
      return done({ t: d.t, v: d.v });
    }).catch(function () { return demo(); });
  };

  /* ---------- headlines and trends ---------- */
  F.news = [];
  F.newsAt = null;
  function normTitle(t) { return t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); }
  function fetchOne(s) {
    return F.getJSON('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(s.url), 12000).then(function (d) {
      if (!d || d.status !== 'ok') return [];
      return (d.items || []).map(function (it) {
        var ts = Date.parse(String(it.pubDate || '').replace(' ', 'T') + 'Z');
        return { src: s.name, tags: s.tags, title: String(it.title || '').replace(/\s+/g, ' ').trim(), url: F.safeUrl(it.link), ts: isNaN(ts) ? Date.now() : ts };
      });
    }).catch(function () { return []; });
  }
  F.loadNews = function () {
    var cached = F.cache.get('news', 10 * 60 * 1000);
    if (cached) { F.news = cached; F.newsAt = new Date(); return Promise.resolve(F.news); }
    var out = [], q = F.SOURCES.slice(), workers = [], n;
    function run() { var s = q.shift(); if (!s) return Promise.resolve(); return fetchOne(s).then(function (r) { out = out.concat(r); return run(); }); }
    for (n = 0; n < 3; n++) workers.push(run());
    return Promise.all(workers).then(function () {
      var seen = {}, list = out.filter(function (i) { var k = normTitle(i.title); if (!k || seen[k]) return false; seen[k] = 1; return true; });
      list.sort(function (a, b) { return b.ts - a.ts; });
      if (list.length) { F.news = list; F.newsAt = new Date(); F.cache.set('news', list); }
      else { var old = F.cache.get('news'); if (old) { F.news = old; F.newsAt = new Date(); } }
      return F.news;
    });
  };
  F.ago = function (ts) {
    var m = Math.max(1, Math.round((Date.now() - ts) / 60000));
    return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago';
  };
  F.trends = function () {
    var cut = Date.now() - 48 * 3600 * 1000, items = F.news.filter(function (i) { return i.ts >= cut; });
    if (items.length < 20) items = F.news;
    var topics = F.TOPICS.map(function (t) { return { id: t.id, label: t.label, cat: t.cat, n: 0, outlets: {}, stories: [] }; });
    items.forEach(function (it) {
      F.TOPICS.forEach(function (t, i) {
        if (t.re.test(it.title)) { var o = topics[i]; o.n++; o.outlets[it.src] = 1; o.stories.push(it); }
      });
    });
    topics = topics.filter(function (t) { return t.n > 0; }).sort(function (a, b) { return b.n - a.n || a.label.localeCompare(b.label); }).slice(0, 13);
    var outlets = {}; items.forEach(function (i) { outlets[i.src] = 1; });
    return { topics: topics, stories: items.length, outlets: Object.keys(outlets).length };
  };
  F.newsFor = function (k, n) {
    var m = MK[k], list = F.news.filter(function (i) {
      if (m.tags) return i.tags.some(function (t) { return m.tags.indexOf(t) >= 0; });
      return m.re && m.re.test(i.title);
    });
    if (list.length < n) list = list.concat(F.news.filter(function (i) { return list.indexOf(i) < 0; }));
    return list.slice(0, n);
  };
})();
