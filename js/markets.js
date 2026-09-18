/* FRMM data layer
   - Stocks / indices / UK ADRs : Finnhub (REST + WebSocket), needs a free key. Otherwise DEMO.
   - Crypto                     : CoinGecko (REST, 60s) + Binance (WebSocket, live). No key.
*/
(function () {
  'use strict';

  var F = window.FRMM = window.FRMM || {};
  var CFG = Object.assign({
    FINNHUB_KEY: '', COINS_REFRESH_MS: 60000, NEWS_REFRESH_MS: 240000, FINNHUB_SPACING_MS: 1150
  }, window.FRMM_CONFIG || {});

  var KEY = CFG.FINNHUB_KEY || '';
  F.keySource = KEY ? 'config' : 'none';
  try {
    var saved = localStorage.getItem('frmm.finnhubKey');
    if (saved) { KEY = saved; F.keySource = 'browser'; }
  } catch (e) { /* storage blocked */ }
  F.cfg = CFG;
  F.key = (KEY || '').trim();

  /* ---------- tiny event bus ---------- */
  var handlers = {};
  F.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  F.emit = function (ev, data) {
    (handlers[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } });
  };
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function gauss() { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2; }

  /* ---------- Universe: [symbol, name, demo base price] ---------- */
  var US_INDEX = [
    ['SPY', 'S&P 500', 680], ['QQQ', 'Nasdaq 100', 610], ['DIA', 'Dow Jones', 470], ['IWM', 'Russell 2000', 250]
  ];
  var US_STOCKS = [
    ['AAPL', 'Apple', 240], ['MSFT', 'Microsoft', 500], ['NVDA', 'NVIDIA', 190], ['AMZN', 'Amazon', 230],
    ['GOOGL', 'Alphabet', 250], ['TSLA', 'Tesla', 430], ['META', 'Meta Platforms', 700], ['AVGO', 'Broadcom', 350],
    ['JPM', 'JPMorgan Chase', 300], ['V', 'Visa', 340], ['MA', 'Mastercard', 570], ['UNH', 'UnitedHealth', 330],
    ['XOM', 'Exxon Mobil', 115], ['LLY', 'Eli Lilly', 800], ['WMT', 'Walmart', 100], ['COST', 'Costco', 900],
    ['HD', 'Home Depot', 380], ['NFLX', 'Netflix', 1200], ['AMD', 'AMD', 200], ['CRM', 'Salesforce', 250],
    ['ORCL', 'Oracle', 280], ['BAC', 'Bank of America', 52], ['KO', 'Coca-Cola', 68], ['PEP', 'PepsiCo', 145],
    ['DIS', 'Disney', 110], ['INTC', 'Intel', 35], ['PYPL', 'PayPal', 70], ['UBER', 'Uber', 95],
    ['COIN', 'Coinbase', 330], ['PLTR', 'Palantir', 180]
  ];
  var UK = [
    ['EWU', 'UK equities (MSCI UK ETF)', 42], ['SHEL', 'Shell', 73], ['AZN', 'AstraZeneca', 78], ['HSBC', 'HSBC Holdings', 70],
    ['BP', 'BP plc', 35], ['UL', 'Unilever', 60], ['GSK', 'GSK', 42], ['DEO', 'Diageo', 100],
    ['RIO', 'Rio Tinto', 68], ['BTI', 'British American Tobacco', 52], ['BCS', 'Barclays', 20], ['LYG', 'Lloyds Banking', 4.6],
    ['VOD', 'Vodafone', 11], ['NGG', 'National Grid', 72]
  ];

  F.GROUPS = {
    usIndex: US_INDEX.map(function (r) { return r[0]; }),
    us: US_STOCKS.map(function (r) { return r[0]; }),
    uk: UK.map(function (r) { return r[0]; })
  };

  var Q = F.quotes = {};
  function seed(list, group) {
    list.forEach(function (r) {
      Q[r[0]] = { sym: r[0], name: r[1], group: group, base: r[2], price: null, prev: null, chg: 0, pct: 0, hi: 0, lo: 0, open: 0, ts: 0 };
    });
  }
  seed(US_INDEX, 'usIndex'); seed(US_STOCKS, 'us'); seed(UK, 'uk');
  // Symbols shown on the page first, so the panels fill quickly within Finnhub's rate limit
  var PRIORITY = ['SPY', 'QQQ', 'DIA', 'IWM', 'EWU', 'SHEL', 'AZN', 'HSBC', 'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'BP', 'UL', 'GSK', 'DEO', 'RIO', 'BTI'];
  var ALL = PRIORITY.concat(Object.keys(Q).filter(function (s) { return PRIORITY.indexOf(s) < 0; }));

  /* ---------- Modes ---------- */
  // stocks: 'live' (key accepted) | 'demo'
  F.stockMode = F.key ? 'live' : 'demo';
  F.stockNote = F.key ? '' : 'No Finnhub key';
  F.wsStocks = false;
  F.wsCrypto = false;
  F.cryptoMode = 'connecting'; // 'live' | 'demo' | 'connecting'

  var dirty = false;
  function markDirty() { if (!dirty) { dirty = true; requestAnimationFrame(function () { dirty = false; F.emit('tick'); }); } }
  F.markDirty = markDirty;

  /* ---------- Market hours ---------- */
  function zoned(tz) {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var mins = (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10);
    return { day: o.weekday, mins: mins, weekend: o.weekday === 'Sat' || o.weekday === 'Sun' };
  }
  F.marketStatus = function () {
    var ny = zoned('America/New_York'), ldn = zoned('Europe/London');
    return {
      nyse: !ny.weekend && ny.mins >= 570 && ny.mins < 960,
      lse: !ldn.weekend && ldn.mins >= 480 && ldn.mins < 990
    };
  };

  /* ---------- Quote helpers ---------- */
  function applyPrice(q, p) {
    if (q.prev == null || !isFinite(p)) return;
    q.price = p;
    q.chg = p - q.prev;
    q.pct = q.prev ? (q.chg / q.prev) * 100 : 0;
    if (!q.hi || p > q.hi) q.hi = p;
    if (!q.lo || p < q.lo) q.lo = p;
    q.ts = Date.now();
  }

  /* ---------- DEMO stocks ---------- */
  var demoTimer = null;
  function startDemoStocks() {
    F.stockMode = 'demo';
    ALL.forEach(function (s) {
      var q = Q[s];
      q.prev = q.base;
      var drift = gauss() * 1.6;                       // day move around +/-1.6%
      q.open = q.base * (1 + gauss() * 0.002);
      q.price = q.base * (1 + drift / 100);
      q.hi = Math.max(q.price, q.open) * (1 + rand(0.001, 0.006));
      q.lo = Math.min(q.price, q.open) * (1 - rand(0.001, 0.006));
      applyPrice(q, q.price);
      q._d = drift;
    });
    markDirty();
    if (demoTimer) return;
    demoTimer = setInterval(function () {
      var n = 6 + Math.floor(Math.random() * 8);
      for (var i = 0; i < n; i++) {
        var q = Q[ALL[Math.floor(Math.random() * ALL.length)]];
        if (!q || q.price == null) continue;
        applyPrice(q, q.price * (1 + gauss() * 0.0007));
      }
      markDirty();
    }, 1100);
  }

  /* ---------- LIVE stocks: Finnhub ---------- */
  var authFailed = false;
  function failToDemo(reason) {
    if (authFailed) return;
    authFailed = true;
    F.stockNote = reason;
    startDemoStocks();
    F.emit('mode');
  }

  function fetchQuote(sym) {
    return fetch('https://finnhub.io/api/v1/quote?symbol=' + encodeURIComponent(sym) + '&token=' + encodeURIComponent(F.key))
      .then(function (r) {
        if (r.status === 401) throw new Error('auth');
        if (r.status === 403) throw new Error('forbidden');   // symbol not on the free plan: skip it, keep the key
        if (r.status === 429) throw new Error('rate');
        if (!r.ok) throw new Error('http');
        return r.json();
      })
      .then(function (j) {
        var q = Q[sym];
        if (!j || !j.c) { q._bad = (q._bad || 0) + 1; return; }
        q.prev = j.pc || q.prev || j.c;
        q.open = j.o || j.c;
        q.hi = j.h || j.c;
        q.lo = j.l || j.c;
        q.price = j.c;
        q.chg = (j.d != null) ? j.d : j.c - q.prev;
        q.pct = (j.dp != null) ? j.dp : (q.prev ? (q.chg / q.prev) * 100 : 0);
        q.ts = (j.t ? j.t * 1000 : Date.now());
        markDirty();
      });
  }

  async function pollLoop() {
    var i = 0;
    while (!authFailed) {
      var sym = ALL[i++ % ALL.length];
      var q = Q[sym];
      if (!(q._bad >= 3)) {
        try { await fetchQuote(sym); }
        catch (e) {
          if (e.message === 'auth') { failToDemo('Key rejected by Finnhub'); return; }
          if (e.message === 'forbidden') { q._bad = 3; }
          if (e.message === 'rate') { await sleep(15000); }
        }
      }
      await sleep(F.cfg.FINNHUB_SPACING_MS);
    }
  }

  var wsBackoff = 2000;
  function startStockSocket() {
    if (authFailed) return;
    var ws;
    try { ws = new WebSocket('wss://ws.finnhub.io?token=' + encodeURIComponent(F.key)); } catch (e) { return; }
    ws.onopen = function () {
      F.wsStocks = true; wsBackoff = 2000;
      ALL.forEach(function (s) { ws.send(JSON.stringify({ type: 'subscribe', symbol: s })); });
      F.emit('mode');
    };
    ws.onmessage = function (e) {
      var m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (m.type !== 'trade' || !m.data) return;
      var latest = {};
      m.data.forEach(function (t) { latest[t.s] = t.p; });
      for (var s in latest) { var q = Q[s]; if (q && q.price != null) applyPrice(q, latest[s]); }
      markDirty();
    };
    ws.onclose = function () {
      F.wsStocks = false; F.emit('mode');
      if (authFailed) return;
      setTimeout(startStockSocket, wsBackoff);
      wsBackoff = Math.min(60000, wsBackoff * 2);
    };
    ws.onerror = function () { try { ws.close(); } catch (e) { /* noop */ } };
  }

  /* ---------- Crypto ---------- */
  var STABLES = { usdt: 1, usdc: 1, dai: 1, fdusd: 1, usde: 1, tusd: 1, usds: 1, busd: 1, pyusd: 1, usd1: 1, usdd: 1, susds: 1, steth: 1, wsteth: 1, wbtc: 1, weth: 1, wbeth: 1, weeth: 1, bsc: 1, usdtb: 1, cbbtc: 1, 'bsc-usd': 1, ethena: 1 };
  F.coins = [];
  var coinBySym = {};
  F.coinsUpdated = 0;

  function sparkDemo(base) {
    var a = [], v = base * rand(.93, 1.0);
    for (var i = 0; i < 84; i++) { v *= 1 + gauss() * 0.006; a.push(v); }
    return a;
  }
  var DEMO_COINS = [
    ['bitcoin', 'btc', 'Bitcoin', 105000, 2.1e12], ['ethereum', 'eth', 'Ethereum', 3900, 4.7e11], ['ripple', 'xrp', 'XRP', 2.6, 1.5e11],
    ['binancecoin', 'bnb', 'BNB', 980, 1.4e11], ['solana', 'sol', 'Solana', 210, 1.1e11], ['dogecoin', 'doge', 'Dogecoin', 0.22, 3.3e10],
    ['tron', 'trx', 'TRON', 0.31, 3.0e10], ['cardano', 'ada', 'Cardano', 0.74, 2.7e10], ['chainlink', 'link', 'Chainlink', 21, 1.4e10],
    ['avalanche-2', 'avax', 'Avalanche', 32, 1.3e10], ['sui', 'sui', 'Sui', 3.6, 1.2e10], ['stellar', 'xlm', 'Stellar', 0.41, 1.2e10],
    ['hedera-hashgraph', 'hbar', 'Hedera', 0.24, 1.0e10], ['litecoin', 'ltc', 'Litecoin', 110, 8.4e9], ['polkadot', 'dot', 'Polkadot', 4.4, 6.9e9],
    ['uniswap', 'uni', 'Uniswap', 9.8, 5.9e9]
  ];
  function seedDemoCoins() {
    F.coins = DEMO_COINS.map(function (r) {
      var sp = sparkDemo(r[3]);
      var price = sp[sp.length - 1];
      return { id: r[0], sym: r[1], name: r[2], image: '', price: price, pct: gauss() * 4, hi: price * 1.03, lo: price * .97, cap: r[4], spark: sp, demo: true };
    });
    reindexCoins();
  }
  function reindexCoins() {
    coinBySym = {};
    F.coins.forEach(function (c) { coinBySym[c.sym] = c; });
  }

  function loadCoins() {
    var url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=60&page=1&sparkline=true&price_change_percentage=24h';
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('cg ' + r.status); return r.json(); })
      .then(function (arr) {
        var prev = coinBySym;
        F.coins = arr.filter(function (c) { return !STABLES[c.symbol] && !STABLES[c.id]; }).map(function (c) {
          var old = prev[c.symbol];
          var fresh = old && old.wsTs && (Date.now() - old.wsTs < 20000);
          return {
            id: c.id, sym: c.symbol, name: c.name, image: c.image,
            price: fresh ? old.price : c.current_price,
            pct: fresh ? old.pct : (c.price_change_percentage_24h != null ? c.price_change_percentage_24h : 0),
            hi: c.high_24h, lo: c.low_24h, cap: c.market_cap,
            spark: (c.sparkline_in_7d && c.sparkline_in_7d.price) || [],
            wsTs: fresh ? old.wsTs : 0
          };
        });
        reindexCoins();
        F.coinsUpdated = Date.now();
        F.cryptoMode = 'live';
        F.emit('coins'); F.emit('mode'); markDirty();
        if (!cryptoSocket) startCryptoSocket();
      })
      .catch(function (e) {
        console.warn('[FRMM] CoinGecko unavailable:', e.message);
        if (!F.coins.length) { seedDemoCoins(); F.cryptoMode = 'demo'; startCoinDemo(); F.emit('coins'); F.emit('mode'); markDirty(); }
      });
  }

  var coinDemoTimer = null;
  function startCoinDemo() {
    if (coinDemoTimer) return;
    coinDemoTimer = setInterval(function () {
      if (F.cryptoMode !== 'demo') return;
      F.coins.forEach(function (c) {
        if (Math.random() < .5) {
          var np = c.price * (1 + gauss() * 0.0012);
          c.pct += ((np - c.price) / c.price) * 100; c.price = np;
        }
      });
      markDirty();
    }, 1000);
  }

  var cryptoSocket = null, cBackoff = 2000;
  function startCryptoSocket() {
    var syms = F.coins.slice(0, 30).map(function (c) { return c.sym + 'usdt@miniTicker'; });
    if (!syms.length) return;
    var ws;
    try { ws = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + syms.join('/')); } catch (e) { return; }
    cryptoSocket = ws;
    ws.onopen = function () { F.wsCrypto = true; cBackoff = 2000; F.emit('mode'); };
    ws.onmessage = function (e) {
      var m; try { m = JSON.parse(e.data); } catch (x) { return; }
      var d = m && m.data; if (!d || !d.s) return;
      var c = coinBySym[d.s.replace(/USDT$/, '').toLowerCase()];
      if (!c) return;
      var last = parseFloat(d.c), open = parseFloat(d.o);
      if (!isFinite(last)) return;
      c.price = last;
      if (open) c.pct = ((last - open) / open) * 100;
      c.hi = parseFloat(d.h) || c.hi; c.lo = parseFloat(d.l) || c.lo;
      c.wsTs = Date.now();
      markDirty();
    };
    ws.onclose = function () {
      F.wsCrypto = false; cryptoSocket = null; F.emit('mode');
      setTimeout(startCryptoSocket, cBackoff);
      cBackoff = Math.min(60000, cBackoff * 2);
    };
    ws.onerror = function () { try { ws.close(); } catch (e) { /* noop */ } };
  }

  /* ---------- Movers ---------- */
  F.getMovers = function (pool, n) {
    var list;
    if (pool === 'crypto') {
      list = F.coins.filter(function (c) { return c.price != null; }).map(function (c) {
        return { sym: c.sym.toUpperCase(), name: c.name, price: c.price, pct: c.pct, crypto: true };
      });
    } else {
      list = F.GROUPS[pool].map(function (s) { return Q[s]; })
        .filter(function (q) { return q.price != null && q.sym !== 'EWU'; });
    }
    var byPct = list.slice().sort(function (a, b) { return b.pct - a.pct; });
    return { winners: byPct.filter(function (x) { return x.pct > 0; }).slice(0, n), losers: byPct.filter(function (x) { return x.pct < 0; }).reverse().slice(0, n) };
  };

  /* ---------- Boot ---------- */
  F.startMarkets = function () {
    if (F.key) {
      pollLoop();
      startStockSocket();
    } else {
      startDemoStocks();
    }
    loadCoins();
    setInterval(loadCoins, F.cfg.COINS_REFRESH_MS);
    // if nothing arrives from CoinGecko within 8s, show demo coins so the page is never empty
    setTimeout(function () { if (!F.coins.length) { seedDemoCoins(); F.cryptoMode = 'demo'; startCoinDemo(); F.emit('coins'); F.emit('mode'); markDirty(); } }, 8000);
  };

  F.stockLabel = function () {
    if (F.stockMode === 'demo') return { text: 'DEMO', cls: 'is-demo' };
    var open = F.marketStatus().nyse;
    return open ? { text: 'LIVE', cls: 'is-live' } : { text: 'LAST CLOSE', cls: 'is-close' };
  };
  F.cryptoLabel = function () {
    if (F.cryptoMode === 'demo') return { text: 'DEMO', cls: 'is-demo' };
    if (F.cryptoMode === 'live' && F.wsCrypto) return { text: 'LIVE', cls: 'is-live' };
    if (F.cryptoMode === 'live') return { text: 'UPDATES EVERY 60S', cls: 'is-close' };
    return { text: 'CONNECTING', cls: 'is-close' };
  };
})();
