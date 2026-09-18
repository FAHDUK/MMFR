/* FRMM UI: builds the panels and keeps them in sync with the data layer */
(function () {
  'use strict';

  var F = window.FRMM;
  var $ = function (id) { return document.getElementById(id); };
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtPrice(n) {
    if (n == null || !isFinite(n)) return '--';
    var a = Math.abs(n), d = a >= 1 ? 2 : a >= 0.1 ? 4 : 6;
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function r2(n) { return Math.round(n * 100) / 100; }
  function fmtPct(n, abs) {
    if (n == null || !isFinite(n)) return '--';
    var v = Math.abs(r2(n)).toFixed(2) + '%';
    return abs ? v : ((r2(n) > 0 ? '+' : r2(n) < 0 ? '-' : '') + v);
  }
  function dir(n) { return r2(n) > 0 ? 'up' : r2(n) < 0 ? 'down' : 'flat'; }
  var compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 2 });
  function flash(el, d) {
    var c = d === 'up' ? 'flash-up' : 'flash-down';
    el.classList.remove('flash-up', 'flash-down'); void el.offsetWidth; el.classList.add(c);
  }
  function label(sym) { return sym === 'EWU' ? 'UK equities' : F.quotes[sym].name; }

  /* ---------- live bindings ---------- */
  var bindings = [];
  function coinOf(key) {
    for (var i = 0; i < F.coins.length; i++) { if (F.coins[i].sym === key) return F.coins[i]; }
    return null;
  }
  function addBinding(root, opts) {
    var b = {
      root: root, price: root.querySelector('.price, .p'), pct: root.querySelector('.pct, .c'),
      dot: root.querySelector('.range i'), get: opts.get, prefix: opts.prefix || '$', pctBase: opts.pctBase || 'pct', abs: !!opts.abs, last: null
    };
    bindings.push(b); return b;
  }
  function paint(b) {
    var d = b.get();
    if (!d || d.price == null) { b.root.classList.add('is-loading'); return; }
    b.root.classList.remove('is-loading');
    var txt = b.prefix + fmtPrice(d.price);
    if (b.price && b.price.textContent !== txt) {
      if (b.last != null && d.price !== b.last) flash(b.price, d.price > b.last ? 'up' : 'down');
      b.price.textContent = txt; b.last = d.price;
    }
    if (b.pct) {
      b.pct.textContent = fmtPct(d.pct, b.abs);
      b.pct.className = b.pctBase + ' ' + dir(d.pct);
    }
    if (b.dot && d.hi > d.lo) {
      var pos = Math.min(1, Math.max(0, (d.price - d.lo) / (d.hi - d.lo)));
      b.dot.style.left = (pos * 100).toFixed(1) + '%';
    }
    if (b.root.classList.contains('coin')) {
      b.root.classList.toggle('is-up', d.pct > 0); b.root.classList.toggle('is-down', d.pct < 0);
    }
  }
  function paintAll() { for (var i = 0; i < bindings.length; i++) paint(bindings[i]); }

  /* ---------- US / UK panels ---------- */
  function tileHTML(sym) {
    return '<div class="tile is-loading" data-sym="' + sym + '">' +
      '<div class="tile__top"><b>' + esc(label(sym)) + '</b><span class="chip">' + sym + '</span></div>' +
      '<div class="tile__price price">--</div>' +
      '<div class="tile__bottom"><span class="range" title="Day range"><i></i></span><span class="pct flat">--</span></div></div>';
  }
  function rowHTML(sym) {
    return '<div class="row is-loading" data-sym="' + sym + '">' +
      '<div class="row__id"><b>' + sym + '</b><span>' + esc(label(sym)) + '</span></div>' +
      '<span class="price">--</span><span class="pct flat">--</span></div>';
  }
  function fill(id, syms, fn) {
    var host = $(id); host.innerHTML = syms.map(fn).join('');
    each(host.children, function (el) {
      var s = el.getAttribute('data-sym');
      addBinding(el, { get: function () { return F.quotes[s]; } });
    });
  }

  /* ---------- ticker ---------- */
  var TICKER = [
    ['q', 'SPY', 'S&P 500'], ['q', 'QQQ', 'Nasdaq 100'], ['q', 'DIA', 'Dow'], ['q', 'EWU', 'UK equities'],
    ['c', 'btc', 'BTC'], ['c', 'eth', 'ETH'], ['q', 'NVDA', 'NVDA'], ['q', 'AAPL', 'AAPL'], ['c', 'sol', 'SOL'],
    ['q', 'MSFT', 'MSFT'], ['q', 'TSLA', 'TSLA'], ['q', 'SHEL', 'Shell'], ['c', 'xrp', 'XRP'], ['q', 'AZN', 'AstraZeneca'],
    ['q', 'HSBC', 'HSBC'], ['c', 'doge', 'DOGE']
  ];
  function buildTicker() {
    var track = $('tickerTrack'), html = '';
    for (var pass = 0; pass < 2; pass++) {
      TICKER.forEach(function (t) {
        html += '<span class="tk is-loading" data-k="' + t[0] + ':' + t[1] + '"><b>' + esc(t[2]) + '</b><span class="p">--</span><span class="c flat">--</span></span>';
      });
    }
    track.innerHTML = html;
    each(track.children, function (el) {
      var parts = el.getAttribute('data-k').split(':');
      var isQ = parts[0] === 'q', key = parts[1];
      addBinding(el, {
        pctBase: 'c', abs: true,
        get: isQ ? function () { return F.quotes[key]; } : function () { return coinOf(key); }
      });
    });
  }

  /* ---------- crypto grid ---------- */
  function sparkSVG(arr, id, up) {
    if (!arr || arr.length < 2) return '';
    var step = Math.max(1, Math.floor(arr.length / 56)), pts = [];
    for (var i = 0; i < arr.length; i += step) pts.push(arr[i]);
    pts.push(arr[arr.length - 1]);
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts), span = (max - min) || 1;
    var W = 200, H = 46, pad = 3;
    var d = pts.map(function (v, i) {
      var x = (i / (pts.length - 1)) * W, y = pad + (1 - (v - min) / span) * (H - pad * 2);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
    var col = up ? '#3ee6b8' : '#ff7d8c';
    return '<defs><linearGradient id="sg-' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".32"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + 'Z" fill="url(#sg-' + id + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  }
  function buildCoins() {
    var top = F.coins.slice(0, 12);
    var host = $('coinGrid');
    bindings = bindings.filter(function (b) { return !b.root.classList.contains('coin'); });
    if (!top.length) return;
    host.innerHTML = top.map(function (c) {
      var img = /^https:/.test(c.image || '') ? '<img class="coin__img" loading="lazy" alt="" src="' + esc(c.image) + '">' : '<span class="coin__img">' + esc(c.sym.slice(0, 3).toUpperCase()) + '</span>';
      var up = c.spark.length > 1 ? c.spark[c.spark.length - 1] >= c.spark[0] : c.pct >= 0;
      return '<article class="coin is-loading" data-sym="' + esc(c.sym) + '">' +
        '<div class="coin__top">' + img + '<div class="coin__id"><b>' + esc(c.sym.toUpperCase()) + '</b><span>' + esc(c.name) + '</span></div></div>' +
        '<div class="coin__price price">--</div>' +
        '<div class="coin__mid"><span class="pct flat">--</span><span class="coin__24">24H</span></div>' +
        '<svg class="coin__spark" viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true">' + sparkSVG(c.spark, esc(c.id), up) + '</svg>' +
        '<div class="coin__foot"><span>7 day</span><span>Mkt cap $' + compact.format(c.cap || 0) + '</span></div></article>';
    }).join('');
    each(host.children, function (el) {
      var s = el.getAttribute('data-sym');
      addBinding(el, { get: function () { return coinOf(s); } });
      var im = el.querySelector('img.coin__img');
      if (im) im.addEventListener('error', function () { im.style.visibility = 'hidden'; });
    });
    paintAll();
  }

  /* ---------- movers ---------- */
  var pool = 'us', lastMovers = 0;
  function moverList(id, arr, emptyMsg, down) {
    var el = $(id);
    if (!arr.length) { el.innerHTML = '<li class="empty">' + emptyMsg + '</li>'; return; }
    var max = Math.max.apply(null, arr.map(function (x) { return Math.abs(x.pct); })) || 1;
    el.innerHTML = arr.map(function (x, i) {
      return '<li class="mv' + (down ? ' mv--down' : '') + '"><span class="mv__rank">' + (i + 1) + '</span>' +
        '<div class="mv__id"><b>' + esc(x.sym) + '</b><span>' + esc(x.name) + '</span></div>' +
        '<span class="price">$' + fmtPrice(x.price) + '</span>' +
        '<span class="pct ' + dir(x.pct) + '">' + fmtPct(x.pct) + '</span>' +
        '<div class="mv__bar"><i style="width:' + (Math.abs(x.pct) / max * 100).toFixed(1) + '%"></i></div></li>';
    }).join('');
  }
  function renderMovers(force) {
    var now = Date.now();
    if (!force && now - lastMovers < 2000) return;
    lastMovers = now;
    var m = F.getMovers(pool, 6);
    var wait = 'Waiting for the first prices...';
    var any = m.winners.length || m.losers.length;
    moverList('winners', m.winners, any ? 'No risers right now.' : wait, false);
    moverList('losers', m.losers, any ? 'No decliners right now.' : wait, true);
    updateBadges();
  }

  /* ---------- badges, status, hours ---------- */
  function setBadge(el, l) {
    var t = el.querySelector('span'); if (t) t.textContent = l.text;
    el.classList.remove('is-live', 'is-demo', 'is-close'); el.classList.add(l.cls);
  }
  function updateBadges() {
    var s = F.stockLabel(), c = F.cryptoLabel();
    each(document.querySelectorAll('[data-badge]'), function (el) {
      var k = el.getAttribute('data-badge');
      setBadge(el, k === 'stocks' ? s : k === 'crypto' ? c : (pool === 'crypto' ? c : s));
    });
    var tb = $('tickerBadge');
    var demo = s.cls === 'is-demo' && c.cls === 'is-demo';
    setBadge(tb, demo ? { text: 'DEMO', cls: 'is-demo' } : (c.cls === 'is-live' || s.cls === 'is-live') ? { text: 'LIVE', cls: 'is-live' } : { text: 'DELAYED', cls: 'is-close' });
    var ct = $('connectText');
    ct.innerHTML = F.stockMode === 'live' ? 'LIVE DATA<br><span class="live">CONNECTED</span>' : 'CONNECT<br>LIVE DATA';
  }
  function updateHours() {
    var m = F.marketStatus();
    function pill(name, open, hrs) { return '<span class="' + (open ? 'open' : '') + '"><i></i>' + name + ' ' + (open ? 'open' : 'closed') + ' <em>· ' + hrs + '</em></span>'; }
    $('hours').innerHTML = pill('NYSE / Nasdaq', m.nyse, '9:30-16:00 New York') + pill('London Stock Exchange', m.lse, '8:00-16:30 London');
    $('hourNy').classList.toggle('is-open', m.nyse);
    $('hourLdn').classList.toggle('is-open', m.lse);
    $('hourNy').setAttribute('aria-label', 'NYSE and Nasdaq: ' + (m.nyse ? 'open' : 'closed'));
    $('hourLdn').setAttribute('aria-label', 'London Stock Exchange: ' + (m.lse ? 'open' : 'closed'));
  }

  /* ---------- news ---------- */
  var newsTab = 'top';
  function ago(ts) {
    if (!ts) return '';
    var s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' d ago';
  }
  var ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  var ARROW_LONG = '<svg width="34" height="10" viewBox="0 0 34 10" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M0 5h32M28 1l4 4-4 4"/></svg>';

  function renderNews() {
    var feat = $('newsFeature'), host = $('newsList'), list = F.news[newsTab] || [];
    if (!list.length) {
      if (F.newsStatus === 'loading') {
        feat.innerHTML = '<div class="feature n--skel"></div>';
        host.innerHTML = new Array(7).join('<div class="n n--skel"></div>');
      } else {
        feat.innerHTML = '';
        host.innerHTML = '<div class="msg">Live headlines could not be loaded right now. Go straight to the newsrooms:' +
          '<div class="links">' + F.NEWS_FALLBACK_LINKS.map(function (l) { return '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + esc(l[0]) + '</a>'; }).join('') + '</div></div>';
      }
      $('newsFoot').textContent = '';
      if (window.FRMM_reveal) window.FRMM_reveal(feat);
      return;
    }
    var top = list[0], rest = list.slice(1, 7);
    feat.innerHTML = '<a class="feature" href="' + esc(top.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="feature__art" aria-hidden="true"><img src="assets/betta-c.webp" alt="" loading="lazy" decoding="async"></span>' +
      '<span class="feature__body"><span class="tag"><b class="hot">TOP STORY</b><span>' + esc(top.src) + (top.ts ? ' · ' + esc(ago(top.ts)) : '') + '</span></span>' +
      '<span class="feature__title">' + esc(top.title) + '</span>' +
      '<span class="go">READ AT THE SOURCE ' + ARROW_LONG + '</span></span></a>';
    host.innerHTML = rest.map(function (n) {
      return '<a class="n" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="n__body"><span class="tag"><b>' + esc(n.src) + '</b><span>' + esc(ago(n.ts)) + '</span></span>' +
        '<span class="n__title">' + esc(n.title) + '</span></span>' +
        '<span class="n__go" aria-hidden="true">' + ARROW + '</span></a>';
    }).join('');
    var srcs = {}; list.slice(0, 7).forEach(function (n) { srcs[n.src] = 1; });
    var t = F.newsUpdated ? new Date(F.newsUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    $('newsFoot').textContent = 'Updated ' + t + ' · Sources: ' + Object.keys(srcs).join(', ') + '. Links open the original publisher in a new tab.';
    if (window.FRMM_reveal) window.FRMM_reveal(feat);
  }

  /* ---------- menu + Finnhub key ---------- */
  var menu = $('menu'), burger = $('burger'), lastFocus = null;
  function setMenu(open) {
    if (open === !menu.hidden) return;
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    if (open) { lastFocus = document.activeElement; refreshKeyNote(); setTimeout(function () { $('keyInput').focus(); }, 60); }
    else if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }
  function refreshKeyNote() {
    var note = $('keyNote'), input = $('keyInput');
    note.classList.toggle('is-err', F.stockMode === 'demo' && !!F.key);
    if (F.stockMode === 'demo' && F.key) {
      note.textContent = 'This key was rejected by Finnhub (' + F.stockNote + '). Paste a valid one.';
    } else if (F.keySource === 'browser') {
      note.textContent = 'Using the key saved in this browser (ends ' + F.key.slice(-4) + ').';
    } else if (F.keySource === 'config') {
      note.textContent = 'Live data is on, using the built-in key (ends ' + F.key.slice(-4) + ').';
    } else {
      note.textContent = 'No key yet: stock prices show as DEMO until you add one.';
    }
    input.value = '';
  }
  function initMenu() {
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    each(document.querySelectorAll('[data-open-menu]'), function (b) { b.addEventListener('click', function () { setMenu(true); }); });
    each(menu.querySelectorAll('.menu__links a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    each(document.querySelectorAll('.nav a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

    $('keyForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('keyInput').value.trim(), note = $('keyNote');
      if (!/^[A-Za-z0-9_\-]{12,}$/.test(v)) { note.classList.add('is-err'); note.textContent = 'That does not look like a Finnhub key. Paste the API key from finnhub.io/dashboard.'; return; }
      try { localStorage.setItem('frmm.finnhubKey', v); } catch (x) { note.textContent = 'This browser is blocking storage, so the key cannot be saved. Put it in js/config.js instead.'; return; }
      location.reload();
    });
    $('clearKey').addEventListener('click', function () {
      try { localStorage.removeItem('frmm.finnhubKey'); } catch (x) { /* noop */ }
      location.reload();
    });
  }

  /* ---------- boot ---------- */
  var st = F.GROUPS;
  fill('usTiles', st.usIndex, tileHTML);
  fill('usRows', ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA'], rowHTML);
  fill('ukTiles', ['EWU', 'SHEL', 'AZN', 'HSBC'], tileHTML);
  fill('ukRows', ['BP', 'UL', 'GSK', 'DEO', 'RIO', 'BTI'], rowHTML);
  buildTicker();
  updateHours();
  renderNews();
  initMenu();

  F.on('tick', function () { paintAll(); renderMovers(false); });
  F.on('coins', function () { buildCoins(); renderMovers(true); });
  F.on('mode', updateBadges);
  F.on('news', renderNews);

  each($('moversTabs').querySelectorAll('button'), function (btn) {
    btn.addEventListener('click', function () {
      pool = btn.getAttribute('data-pool');
      each($('moversTabs').children, function (b) { b.setAttribute('aria-selected', String(b === btn)); });
      renderMovers(true);
    });
  });
  each($('newsTabs').querySelectorAll('button'), function (btn) {
    btn.addEventListener('click', function () {
      newsTab = btn.getAttribute('data-tab');
      each($('newsTabs').children, function (b) { b.setAttribute('aria-selected', String(b === btn)); });
      renderNews();
    });
  });

  setInterval(function () { updateHours(); updateBadges(); }, 30000);
  setInterval(renderNews, 60000);

  updateBadges();
  F.startMarkets();
  F.startNews();
})();
