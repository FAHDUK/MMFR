/* FRMM markets: Finnhub quotes (REST + WebSocket) for US-listed shares, ETFs and ADRs.
   Only the symbols a page asks for are polled, and results are cached for the browser session,
   so moving between pages is instant and stays inside the free plan's rate limit. */
(function () {
  'use strict';

  var F = window.FRMM;

  /* ---------- Universe: symbol -> [name, region, demo price] ---------- */
  var U = {
    /* United Kingdom (MSCI UK ETF and UK giants listed in New York, priced in US dollars) */
    EWU: ['UK stocks (MSCI UK ETF)', 'uk', 47], SHEL: ['Shell', 'uk', 94], AZN: ['AstraZeneca', 'uk', 166], HSBC: ['HSBC', 'uk', 102],
    BP: ['BP', 'uk', 44.6], UL: ['Unilever', 'uk', 61.8], GSK: ['GSK', 'uk', 50], DEO: ['Diageo', 'uk', 85.6],
    RIO: ['Rio Tinto', 'uk', 97], BTI: ['British American Tobacco', 'uk', 55.8], BCS: ['Barclays', 'uk', 24.9], LYG: ['Lloyds', 'uk', 5.8],
    VOD: ['Vodafone', 'uk', 17], NGG: ['National Grid', 'uk', 76.8], NWG: ['NatWest', 'uk', 14], RELX: ['RELX', 'uk', 46],
    /* United States */
    SPY: ['S&P 500', 'us', 761], QQQ: ['Nasdaq 100', 'us', 721], DIA: ['Dow Jones', 'us', 516], IWM: ['Russell 2000', 'us', 284],
    AAPL: ['Apple', 'us', 336], MSFT: ['Microsoft', 'us', 510], NVDA: ['NVIDIA', 'us', 190], AMZN: ['Amazon', 'us', 230],
    GOOGL: ['Alphabet', 'us', 250], META: ['Meta', 'us', 700], TSLA: ['Tesla', 'us', 364], AVGO: ['Broadcom', 'us', 350],
    JPM: ['JPMorgan Chase', 'us', 300], V: ['Visa', 'us', 340],
    GLD: ['Gold', 'us', 401], USO: ['Oil (US crude)', 'us', 154], UUP: ['US dollar', 'us', 28.4], TLT: ['US government bonds', 'us', 90],
    /* Europe */
    FEZ: ['Euro Stoxx 50', 'eu', 68], VGK: ['Europe (all)', 'eu', 88], EWG: ['Germany', 'eu', 40], EWQ: ['France', 'eu', 40],
    EWI: ['Italy', 'eu', 60], EWP: ['Spain', 'eu', 60.6], EWL: ['Switzerland', 'eu', 60], EWN: ['Netherlands', 'eu', 48],
    ASML: ['ASML', 'eu', 1000], SAP: ['SAP', 'eu', 260], NVO: ['Novo Nordisk', 'eu', 55], TTE: ['TotalEnergies', 'eu', 62], SNY: ['Sanofi', 'eu', 52],
    /* Asia-Pacific */
    EWJ: ['Japan', 'asia', 85], FXI: ['China (large firms)', 'asia', 38], MCHI: ['China (broad)', 'asia', 53], EWH: ['Hong Kong', 'asia', 19],
    INDA: ['India', 'asia', 55], EWY: ['South Korea', 'asia', 75], EWT: ['Taiwan', 'asia', 111], EWS: ['Singapore', 'asia', 26],
    EWA: ['Australia', 'asia', 28.7], TSM: ['TSMC', 'asia', 300], BABA: ['Alibaba', 'asia', 130], SONY: ['Sony', 'asia', 25],
    TM: ['Toyota', 'asia', 200], INFY: ['Infosys', 'asia', 19], PDD: ['PDD (Temu)', 'asia', 130]
  };
  F.SYMS = U;
  F.symName = function (s) { return U[s] ? U[s][0] : s; };

  var Q = F.quotes = {};
  Object.keys(U).forEach(function (s) {
    Q[s] = { sym: s, name: U[s][0], region: U[s][1], base: U[s][2], price: null, prev: null, chg: 0, pct: 0, hi: 0, lo: 0, open: 0, ts: 0, fetched: 0 };
  });

  /* ---------- state ---------- */
  var watched = {};
  F.stockMode = F.key ? 'live' : 'demo';
  F.stockNote = F.key ? '' : 'No Finnhub key';
  F.wsStocks = false;
  var authFailed = false;

  var dirty = false;
  function markDirty() { if (!dirty) { dirty = true; requestAnimationFrame(function () { dirty = false; F.emit('tick'); saveSoon(); }); } }
  F.markDirty = markDirty;

  /* ---------- session cache of quotes ---------- */
  var saveT = 0;
  function saveSoon() {
    if (saveT) return;
    saveT = setTimeout(function () {
      saveT = 0;
      var o = {};
      Object.keys(Q).forEach(function (s) { var q = Q[s]; if (q.price != null && q.fetched && F.stockMode === 'live') o[s] = [q.price, q.prev, q.open, q.hi, q.lo, q.pct, q.chg, q.ts, q.fetched]; });
      F.cache.set('q2', o);
    }, 2500);
  }
  function loadCache() {
    var o = F.cache.get('q2', 30 * 60 * 1000); if (!o) return;
    Object.keys(o).forEach(function (s) {
      var q = Q[s], a = o[s]; if (!q) return;
      q.price = a[0]; q.prev = a[1]; q.open = a[2]; q.hi = a[3]; q.lo = a[4]; q.pct = a[5]; q.chg = a[6]; q.ts = a[7]; q.fetched = a[8];
    });
  }

  /* ---------- exchange hours (public holidays are not shown) ---------- */
  var EX = {
    LSE: { name: 'London', tz: 'Europe/London', o: 480, c: 990 },
    NYSE: { name: 'New York', tz: 'America/New_York', o: 570, c: 960 },
    XETRA: { name: 'Frankfurt', tz: 'Europe/Berlin', o: 540, c: 1050 },
    TSE: { name: 'Tokyo', tz: 'Asia/Tokyo', o: 540, c: 900 },
    HKEX: { name: 'Hong Kong', tz: 'Asia/Hong_Kong', o: 570, c: 960 }
  };
  F.EXCHANGES = EX;
  function zoned(tz) {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    return { mins: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10), weekend: o.weekday === 'Sat' || o.weekday === 'Sun' };
  }
  F.isOpen = function (id) {
    var e = EX[id], z = zoned(e.tz);
    return !z.weekend && z.mins >= e.o && z.mins < e.c;
  };
  F.marketStatus = function () { return { nyse: F.isOpen('NYSE'), lse: F.isOpen('LSE') }; };

  /* ---------- quotes ---------- */
  function applyPrice(q, p) {
    if (q.prev == null || !isFinite(p)) return;
    q.price = p; q.chg = p - q.prev; q.pct = q.prev ? (q.chg / q.prev) * 100 : 0;
    if (!q.hi || p > q.hi) q.hi = p;
    if (!q.lo || p < q.lo) q.lo = p;
    q.ts = Date.now();
  }

  /* demo data: only used with no key, or if Finnhub rejects the key */
  var demoTimer = null;
  function startDemo() {
    F.stockMode = 'demo';
    Object.keys(Q).forEach(function (s) {
      var q = Q[s]; q.prev = q.base;
      var drift = F.gauss() * 1.6;
      q.open = q.base * (1 + F.gauss() * 0.002);
      q.price = q.base * (1 + drift / 100);
      q.hi = Math.max(q.price, q.open) * (1 + F.rand(0.001, 0.006));
      q.lo = Math.min(q.price, q.open) * (1 - F.rand(0.001, 0.006));
      applyPrice(q, q.price);
    });
    markDirty(); F.emit('mode');
    if (demoTimer) return;
    demoTimer = setInterval(function () {
      var keys = Object.keys(watched);
      for (var i = 0; i < 6; i++) {
        var q = Q[keys[Math.floor(Math.random() * keys.length)]];
        if (q && q.price != null) applyPrice(q, q.price * (1 + F.gauss() * 0.0007));
      }
      markDirty();
    }, 1100);
  }
  function failToDemo(reason) {
    if (authFailed) return;
    authFailed = true; F.stockNote = reason; startDemo();
  }

  function fetchQuote(sym) {
    return fetch('https://finnhub.io/api/v1/quote?symbol=' + encodeURIComponent(sym) + '&token=' + encodeURIComponent(F.key))
      .then(function (r) {
        if (r.status === 401) throw new Error('auth');
        if (r.status === 403) throw new Error('forbidden');
        if (r.status === 429) throw new Error('rate');
        if (!r.ok) throw new Error('http');
        return r.json();
      })
      .then(function (j) {
        var q = Q[sym];
        q.fetched = Date.now();
        if (!j || !j.c) { q._bad = (q._bad || 0) + 1; return; }
        q.prev = j.pc || q.prev || j.c; q.open = j.o || j.c; q.hi = j.h || j.c; q.lo = j.l || j.c; q.price = j.c;
        q.chg = (j.d != null) ? j.d : j.c - q.prev;
        q.pct = (j.dp != null) ? j.dp : (q.prev ? (q.chg / q.prev) * 100 : 0);
        q.ts = (j.t ? j.t * 1000 : Date.now());
        markDirty();
      });
  }

  function staleMs() { return (F.isOpen('NYSE') ? 25 : 240) * 1000; }

  async function pollLoop() {
    while (!authFailed) {
      var syms = Object.keys(watched).filter(function (s) { return Q[s] && !(Q[s]._bad >= 3); });
      if (!syms.length) { await F.sleep(600); continue; }
      syms.sort(function (a, b) { return (Q[a].fetched || 0) - (Q[b].fetched || 0); });
      var s = syms[0], q = Q[s];
      if (Date.now() - (q.fetched || 0) < staleMs()) { await F.sleep(1500); continue; }
      try { await fetchQuote(s); }
      catch (e) {
        if (e.message === 'auth') { failToDemo('Key rejected by Finnhub'); return; }
        if (e.message === 'forbidden') { q._bad = 3; F.emit('tick'); }
        if (e.message === 'rate') { await F.sleep(20000); }
      }
      await F.sleep(F.cfg.FINNHUB_SPACING_MS);
    }
  }

  var ws = null, wsBackoff = 3000, wsSubscribed = {};
  function startSocket() {
    if (authFailed || ws) return;
    try { ws = new WebSocket('wss://ws.finnhub.io?token=' + encodeURIComponent(F.key)); } catch (e) { ws = null; return; }
    ws.onopen = function () { F.wsStocks = true; wsBackoff = 3000; wsSubscribed = {}; subscribeAll(); F.emit('mode'); };
    ws.onmessage = function (e) {
      var m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.type !== 'trade' || !m.data) return;
      var latest = {};
      m.data.forEach(function (t) { latest[t.s] = t.p; });
      for (var s in latest) { var q = Q[s]; if (q && q.price != null) applyPrice(q, latest[s]); }
      markDirty();
    };
    ws.onclose = function () {
      ws = null; F.wsStocks = false; F.emit('mode');
      if (authFailed) return;
      setTimeout(startSocket, wsBackoff); wsBackoff = Math.min(60000, wsBackoff * 2);
    };
    ws.onerror = function () { try { ws.close(); } catch (e) { /* noop */ } };
  }
  function subscribeAll() {
    if (!ws || ws.readyState !== 1) return;
    Object.keys(watched).slice(0, 45).forEach(function (s) {
      if (!wsSubscribed[s]) { wsSubscribed[s] = 1; ws.send(JSON.stringify({ type: 'subscribe', symbol: s })); }
    });
  }

  /* ---------- public API ---------- */
  F.watch = function (list) {
    (list || []).forEach(function (s) { if (Q[s]) watched[s] = 1; });
    if (F.stockMode === 'demo' && !demoTimer && (authFailed || !F.key)) startDemo();
    subscribeAll();
  };
  F.startMarkets = function () {
    loadCache();
    if (F.key) {
      pollLoop();
      // live trades only exist while New York trades; check once a minute
      var trySock = function () { if (F.isOpen('NYSE')) startSocket(); };
      trySock(); setInterval(trySock, 60000);
    } else { startDemo(); }
    markDirty();
  };

  F.movers = function (list, n) {
    var arr = list.map(function (s) { return Q[s]; }).filter(function (q) { return q && q.price != null && !(q._bad >= 3); });
    var by = arr.slice().sort(function (a, b) { return b.pct - a.pct; });
    return {
      winners: by.filter(function (x) { return x.pct > 0; }).slice(0, n),
      losers: by.filter(function (x) { return x.pct < 0; }).reverse().slice(0, n)
    };
  };
  F.stockLabel = function () {
    if (F.stockMode === 'demo') return { text: 'DEMO', cls: 'is-demo' };
    return F.isOpen('NYSE') ? { text: 'LIVE', cls: 'is-live' } : { text: 'LAST CLOSE', cls: 'is-close' };
  };
  F.mood = function (list) {
    var v = list.map(function (s) { return Q[s]; }).filter(function (q) { return q && q.price != null && !(q._bad >= 3); });
    if (!v.length) return null;
    var avg = v.reduce(function (a, q) { return a + q.pct; }, 0) / v.length;
    return { avg: avg, label: avg > 0.9 ? 'Smooth sailing' : avg > 0.15 ? 'Gentle swell' : avg > -0.15 ? 'Calm seas' : avg > -0.9 ? 'Choppy waters' : 'Stormy seas' };
  };
})();
