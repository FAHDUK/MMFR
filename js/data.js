/* FRMM data: sterling exchange rates (ECB reference rates via Frankfurter) and crypto (CoinGecko).
   Neither needs a key. */
(function () {
  'use strict';

  var F = window.FRMM;

  /* ---------- sterling against the world ---------- */
  var FX_NAMES = { USD: 'US dollar', EUR: 'Euro', JPY: 'Japanese yen', CHF: 'Swiss franc', CNY: 'Chinese yuan', INR: 'Indian rupee', AUD: 'Australian dollar', CAD: 'Canadian dollar' };
  F.fx = { date: '', pairs: [] };

  function iso(d) { return d.toISOString().slice(0, 10); }
  F.loadFx = function () {
    var cached = F.cache.get('fx', 30 * 60 * 1000);
    if (cached) { F.fx = cached; F.emit('fx'); return Promise.resolve(); }
    var end = new Date(), start = new Date(Date.now() - 10 * 864e5);
    var url = 'https://api.frankfurter.dev/v1/' + iso(start) + '..' + iso(end) + '?base=GBP&symbols=' + Object.keys(FX_NAMES).join(',');
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('fx ' + r.status); return r.json(); })
      .then(function (j) {
        var days = Object.keys(j.rates || {}).sort();
        if (days.length < 1) throw new Error('fx empty');
        var last = j.rates[days[days.length - 1]], prev = j.rates[days[Math.max(0, days.length - 2)]];
        F.fx = {
          date: days[days.length - 1],
          pairs: Object.keys(FX_NAMES).filter(function (c) { return last[c] != null; }).map(function (c) {
            return { code: c, name: FX_NAMES[c], rate: last[c], prev: prev[c], pct: prev[c] ? ((last[c] - prev[c]) / prev[c]) * 100 : 0 };
          })
        };
        F.cache.set('fx', F.fx); F.emit('fx');
      })
      .catch(function (e) { console.warn('[FRMM] exchange rates unavailable:', e.message); });
  };

  /* ---------- crypto ---------- */
  var STABLES = { usdt: 1, usdc: 1, dai: 1, fdusd: 1, usde: 1, tusd: 1, usds: 1, busd: 1, pyusd: 1, usd1: 1, usdd: 1, susds: 1, steth: 1, wsteth: 1, wbtc: 1, weth: 1, wbeth: 1, weeth: 1, bsc: 1, usdtb: 1, cbbtc: 1, 'bsc-usd': 1, ethena: 1, 'usdt0': 1, 'usdc.e': 1, 'figr_heloc': 1, 'bfusd': 1 };
  F.coins = [];
  F.coinsUpdated = 0;
  F.coinsStatus = 'loading';
  try { F.cur = localStorage.getItem('frmm.cur') === 'usd' ? 'usd' : 'gbp'; } catch (e) { F.cur = 'gbp'; }
  F.curSym = function () { return F.cur === 'usd' ? '$' : '£'; };
  F.setCur = function (c) {
    F.cur = c === 'usd' ? 'usd' : 'gbp';
    try { localStorage.setItem('frmm.cur', F.cur); } catch (e) { /* storage blocked */ }
    F.coins = []; F.coinsStatus = 'loading'; F.emit('coins');
    return F.loadCoins();
  };
  F.coinOf = function (sym) {
    for (var i = 0; i < F.coins.length; i++) { if (F.coins[i].sym === sym) return F.coins[i]; }
    return null;
  };

  F.loadCoins = function () {
    var cur = F.cur;
    var cached = F.cache.get('coins.' + cur, 40 * 1000);
    var p = cached ? Promise.resolve(cached) :
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=' + cur + '&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h')
        .then(function (r) { if (!r.ok) throw new Error('coingecko ' + r.status); return r.json(); })
        .then(function (arr) {
          var slim = arr.filter(function (c) { return !STABLES[c.symbol] && !STABLES[c.id]; }).map(function (c) {
            return {
              id: c.id, sym: c.symbol, name: c.name, image: c.image, price: c.current_price,
              pct: c.price_change_percentage_24h != null ? c.price_change_percentage_24h : 0,
              hi: c.high_24h, lo: c.low_24h, cap: c.market_cap,
              spark: ((c.sparkline_in_7d && c.sparkline_in_7d.price) || []).filter(function (_, i) { return i % 3 === 0; })
            };
          });
          F.cache.set('coins.' + cur, slim);
          return slim;
        });
    return p.then(function (list) {
      if (cur !== F.cur) return;
      F.coins = list; F.coinsUpdated = Date.now(); F.coinsStatus = 'ok';
      F.emit('coins'); F.emit('mode'); F.markDirty && F.markDirty();
    }).catch(function (e) {
      console.warn('[FRMM] crypto unavailable:', e.message);
      if (!F.coins.length) { F.coinsStatus = 'error'; F.emit('coins'); F.emit('mode'); }
    });
  };
  F.startCrypto = function () {
    F.loadCoins();
    setInterval(F.loadCoins, F.cfg.COINS_REFRESH_MS);
  };
  F.cryptoLabel = function () {
    if (F.coinsStatus === 'ok') return { text: 'LIVE', cls: 'is-live', help: 'CoinGecko prices refresh about every 45 seconds.' };
    if (F.coinsStatus === 'error') return { text: 'RETRYING', cls: 'is-demo', help: 'The price feed is unavailable and will retry automatically.' };
    return { text: 'CONNECTING', cls: 'is-close', help: 'Waiting for the latest CoinGecko prices.' };
  };

  /* ---------- movers among coins ---------- */
  F.coinMovers = function (n) {
    var by = F.coins.slice().sort(function (a, b) { return b.pct - a.pct; });
    return { winners: by.filter(function (c) { return c.pct > 0; }).slice(0, n), losers: by.filter(function (c) { return c.pct < 0; }).reverse().slice(0, n) };
  };
})();
