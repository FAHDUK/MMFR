/* FRMM views: the home page and the five market pages.
   Each view returns { html, mount(), update(evt) }. update() runs whenever fresh numbers arrive. */
(function () {
  'use strict';
  var F = window.FRMM, MK = F.MK, ORDER = F.ORDER, $ = F.$, $$ = F.$$, esc = F.esc, nf = F.nf, chg = F.chg, px = F.px, ixv = F.ixv, rng = F.rng, hash = F.hash, gauss = F.gauss;
  var AU = F.ARROW_U, AD = F.ARROW_D;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function rgb(h) { var n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
  function fl(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function toEl(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function nm(k) { return k === 'uk' ? 'the UK' : k === 'us' ? 'the US' : MK[k].label; }
  function noun(k) { return k === 'crypto' ? 'coins' : 'companies'; }
  function liveNow(k) { return F.isLive(k); }
  function clearFl(k) { MK[k].cos.forEach(function (c) { c.fl = 0; }); MK[k].idx.forEach(function (x) { x.fl = 0; }); }
  function badge(k) {
    var live = liveNow(k);
    return '<span class="badge ' + (live ? 'live' : 'demo') + '"><i class="dot"></i>' + (live ? (k === 'crypto' ? 'Live' : 'Live, delayed') : 'Demo data') + '</span>';
  }
  function okList(k) { return MK[k].cos.filter(function (c) { return c.ok && c.chg != null && !isNaN(c.chg); }); }
  function movers(k, n) {
    var by = okList(k).sort(function (a, b) { return b.chg - a.chg; });
    return { up: by.slice(0, n), down: by.slice(-n).reverse() };
  }

  /* ---------- conversions ---------- */
  function fxHtml(k, prev, anim) {
    var c = F.CONV[k], d = F.convRows(k);
    return d.rows.map(function (r, i) {
      var v = isNaN(r.v) ? 'n/a' : F.fv(r.v), cls = '';
      if (prev && prev[r.to] != null && !isNaN(r.v) && prev[r.to] !== r.v) cls = r.v > prev[r.to] ? ' flash-u' : ' flash-d';
      return '<div class="card fx glow"' + (anim ? ' style="animation:rise .5s ' + (i * .05) + 's both"' : '') + '><div class="fx__t"><span>' + esc(c.lab) + ' \u2192 ' + r.to + '</span>' + chg(r.chg) + '</div><div class="fx__v' + cls + '">' + v + '</div><div class="fx__n">' + esc(F.CN[r.to]) + '</div>' + F.spark(r.sp, (r.chg || 0) >= 0, 100, 26) + '</div>';
    }).join('');
  }
  function fxSection(k) {
    var c = F.CONV[k], d = F.convRows(k);
    return '<section class="sec" style="padding-top:24px"><div class="sec__h"><h2>' + c.title + '</h2><p id="fxSub">' + fxSub(k, d) + '</p></div><div class="rail" id="fxRail">' + fxHtml(k) + '</div></section>';
  }
  function fxSub(k, d) { return esc(F.CONV[k].sub) + (d.live ? '' : ' \u00b7 sample rates until the feed connects'); }

  /* ---------- trends infographic and news ---------- */
  var SPAN = [[5, 3], [4, 3], [3, 3], [4, 2], [3, 2], [3, 2], [2, 2], [2, 1], [2, 1], [2, 1], [2, 1], [2, 1], [2, 1]];
  function trendsHtml() {
    if (!F.news.length) return '<div class="card note">Reading the headlines. Trends appear as soon as they load.</div>';
    var T = F.trends();
    if (!T.topics.length) return '<div class="card note">No clear trends in the latest headlines.</div>';
    var mosaic = T.topics.map(function (t, i) {
      var c = F.CATS[t.cat], sp = SPAN[i] || [2, 1], fs = i === 0 ? 30 : i === 1 ? 26 : i === 2 ? 23 : i < 7 ? 19 : 14, top = t.stories[0];
      return '<a class="t glow' + (sp[1] === 1 ? ' t--s' : '') + '" href="' + esc(top.url) + '" target="_blank" rel="noopener noreferrer" style="--c:' + c[1] + ';--cr:' + rgb(c[1]) + ';--gc:' + sp[0] + ';--gr:' + sp[1] + ';--fs:' + fs + 'px;animation:rise .5s ' + (i * .04) + 's both" aria-label="' + esc(t.label) + ', ' + t.n + ' stories"><span class="t__c">' + esc(c[0]) + '</span><b>' + esc(t.label) + '</b><span class="t__n"><em>' + t.n + '</em> ' + (t.n === 1 ? 'story' : 'stories') + '</span></a>';
    }).join('');
    var max = T.topics[0].n;
    var top5 = T.topics.slice(0, 5).map(function (t, i) {
      var c = F.CATS[t.cat], outs = Object.keys(t.outlets).length;
      return '<div class="card hot glow" style="--c:' + c[1] + ';--cr:' + rgb(c[1]) + ';animation:rise .5s ' + (i * .05) + 's both"><div class="hot__top"><span class="rk">' + (i + 1) + '</span><span class="t__c">' + esc(c[0]) + '</span></div><h3>' + esc(t.label) + '</h3><div class="hot__m"><b class="num">' + t.n + '</b> ' + (t.n === 1 ? 'story' : 'stories') + ' from ' + outs + (outs === 1 ? ' outlet' : ' outlets') + '</div><div class="hot__bar"><i style="width:' + Math.round(t.n / max * 100) + '%"></i></div><ul>' +
        t.stories.slice(0, 2).map(function (h) { return '<li><a href="' + esc(h.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(h.title) + '</span><small>' + esc(h.src) + ' \u2192</small></a></li>'; }).join('') + '</ul></div>';
    }).join('');
    var mins = F.newsAt ? Math.max(0, Math.round((Date.now() - F.newsAt.getTime()) / 60000)) : 0;
    return '<div class="card info"><div class="info__top"><div class="stats"><div><b class="num">' + T.stories + '</b><span>stories read</span></div><div><b class="num">' + T.outlets + '</b><span>outlets</span></div><div><b class="num">' + (mins < 1 ? 'now' : mins + ' min') + '</b><span>since update</span></div></div><div class="key">' + Object.keys(F.CATS).map(function (k) { return '<span><i style="--c:' + F.CATS[k][1] + '"></i>' + esc(F.CATS[k][0]) + '</span>'; }).join('') + '</div></div>' +
      '<div class="mosaic">' + mosaic + '</div><p class="info__f">Bigger tile, more stories. Colour shows the type of topic. Tap a tile to read the top story at its source.</p></div>' +
      '<div class="sec__h" style="margin-top:28px"><h2 style="font-size:20px">Top 5 trends, with the reports</h2><p>Every link opens the original outlet</p></div><div class="rail">' + top5 + '</div>';
  }
  function newsCards(list) {
    if (!list.length) return '<div class="card note">Headlines will appear here once the newsfeeds respond.</div>';
    return '<div class="news">' + list.map(function (n, i) {
      return '<a class="card nw glow" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer" style="animation:rise .5s ' + (i * .06) + 's both"><span class="src"><b>' + esc(n.src) + '</b>' + F.ago(n.ts) + '</span><p>' + esc(n.title) + '</p><span class="go">Read at the source \u2192</span></a>';
    }).join('') + '</div>';
  }

  /* ---------- keyed list update: keeps rows in rank order and flashes only what moved ---------- */
  function reconcile(box, list, rowHtml) {
    var old = {}, i;
    $$('[data-t]', box).forEach(function (e) { old[e.dataset.t] = e; });
    list.forEach(function (c, i) {
      var fresh = toEl(rowHtml(c, i)), el = old[c.ys];
      delete old[c.ys];
      if (!el) el = fresh;
      else {
        $('.rk', el).textContent = i + 1;
        var a = $('.pp', el), b = $('.pp', fresh);
        a.className = b.className; a.innerHTML = b.innerHTML;
        $('.dr__s', el).innerHTML = $('.dr__s', fresh).innerHTML;
      }
      if (c.fl) { fl($('.pp', el), 'fl'); fl(el, c.fl > 0 ? 'flash-u' : 'flash-d'); }
      if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null);
    });
    Object.keys(old).forEach(function (k) { old[k].remove(); });
    for (i = box.children.length - 1; i >= list.length; i--) box.children[i].remove();
  }

  /* ---------- home ---------- */
  function candles() {
    var r = rng(77), n = 40, out = '', W = 760, H = 400, i;
    for (i = 0; i < n; i++) {
      var x = 24 + i * 18.4, trend = 190 + 130 * Math.sin(i / 5) * 0.4 - i * 2.9 + gauss(r) * 18, o = trend + gauss(r) * 22, c = o + gauss(r) * 26, up = c < o;
      var hi = Math.min(o, c) - 10 - r() * 22, lo = Math.max(o, c) + 10 + r() * 22, col = up ? 'var(--up)' : 'var(--down)';
      out += '<g class="cd" style="--dl:' + (-r() * 3.6).toFixed(2) + 's;--s:' + (1 + r() * 0.16).toFixed(2) + '"><line x1="' + x + '" x2="' + x + '" y1="' + hi.toFixed(1) + '" y2="' + lo.toFixed(1) + '" stroke="' + col + '" stroke-width="2.4" stroke-linecap="round"/><rect x="' + (x - 6.5) + '" y="' + Math.min(o, c).toFixed(1) + '" width="13" height="' + Math.max(8, Math.abs(c - o)).toFixed(1) + '" rx="4" fill="' + col + '"/></g>';
    }
    return '<svg class="c" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + out + '</svg>';
  }

  var deskK = 'uk', deskP = '1D', deskTok = 0, deskLive = {};
  var PERL = { '1D': 'today', '1W': 'past week', '1M': 'past month', '3M': 'past 3 months', '1Y': 'past year' };
  function bigHtml(m, v) { var t = ixv(m, v), i = t.lastIndexOf('.'); return i < 0 ? t : t.slice(0, i) + '<small>' + t.slice(i) + '</small>'; }
  function dpOf(m, v) { return m.k === 'crypto' ? (v < 100 ? 2 : 0) : 1; }
  function rowHtml(k, m) {
    return function (c, i) {
      var u = c.chg >= 0;
      return '<a class="dr" href="#/' + k + '" data-t="' + esc(c.ys) + '"><i class="rk">' + (i + 1) + '</i><span class="dr__n"><b>' + esc(c.t) + '</b><span class="n">' + esc(c.n) + '</span></span><span class="dr__s">' + F.spark(c.sp, u, 76, 28) + '</span><span class="pp ' + (u ? 'up' : 'down') + '"><b>' + px(c) + '</b><i>' + F.pcs(c.chg) + '</i></span></a>';
    };
  }
  function deskDelta(vals, hoverV) {
    var m = MK[deskK], ix = m.idx[0], el = $('#deskD'); if (!el) return;
    var cur = hoverV != null ? hoverV : ix.val, start = deskP === '1D' && ix.chg != null ? ix.val / (1 + ix.chg / 100) : vals[0];
    var d = cur - start, pc = d / start * 100, up = d >= 0;
    el.className = 'bigd ' + (up ? 'up' : 'down');
    el.innerHTML = (up ? AU : AD) + (up ? '+' : '\u2212') + nf(Math.abs(d), dpOf(m, cur)) + ' (' + nf(Math.abs(pc), 2) + '%) <span>' + PERL[deskP] + '</span>';
  }
  var deskVals = null;
  function drawDesk() {
    var box = $('#deskC'); if (!box) return;
    var tok = ++deskTok, k = deskK, m = MK[k], p = deskP;
    F.chart(k, 0, p).then(function (d) {
      if (tok !== deskTok || !$('#deskC')) return;
      var vals = d.v, W = box.clientWidth || 340, H = 172, n = vals.length, up = vals[n - 1] >= vals[0];
      deskVals = vals;
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), sp = (mx - mn) || 1, col = up ? 'var(--up)' : 'var(--down)';
      var X = function (i) { return 4 + i / (n - 1) * (W - 12); }, Y = function (v) { return 12 + (1 - (v - mn) / sp) * (H - 28); };
      var path = vals.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
      box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><defs><linearGradient id="dgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:' + col + ';stop-opacity:.3"/><stop offset="1" style="stop-color:' + col + ';stop-opacity:0"/></linearGradient></defs>' +
        '<path d="' + path + 'L' + X(n - 1).toFixed(1) + ' ' + H + 'L' + X(0).toFixed(1) + ' ' + H + 'Z" fill="url(#dgr)"/><path d="' + path + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<line id="dxl" y1="0" y2="' + H + '" stroke="' + col + '" stroke-opacity=".5" stroke-dasharray="3 4" style="display:none"/><circle id="dxd" r="5" fill="' + col + '" stroke="var(--surface)" stroke-width="2.5" cx="' + X(n - 1).toFixed(1) + '" cy="' + Y(vals[n - 1]).toFixed(1) + '"/></svg>';
      var rt = $('#deskR'); if (rt) rt.style.setProperty('--c', up ? 'var(--up)' : 'var(--down)');
      var xl = $('#dxl', box), xd = $('#dxd', box), big = $('#deskV');
      function back() { xl.style.display = 'none'; xd.setAttribute('cx', X(n - 1)); xd.setAttribute('cy', Y(vals[n - 1])); big.innerHTML = bigHtml(m, m.idx[0].val); deskDelta(vals); }
      box.onpointermove = function (e) {
        var r = box.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left - 4) / (W - 12) * (n - 1))));
        xl.style.display = ''; xl.setAttribute('x1', X(i)); xl.setAttribute('x2', X(i)); xd.setAttribute('cx', X(i)); xd.setAttribute('cy', Y(vals[i]));
        big.innerHTML = bigHtml(m, vals[i]); deskDelta(vals, vals[i]);
      };
      box.onpointerleave = back;
      deskDelta(vals);
    });
  }
  function paintDeskLists(k) {
    var m = MK[k], mv = movers(k, 6), rp = $('#deskRise'), fp = $('#deskFall'); if (!rp) return;
    var row = rowHtml(k, m);
    reconcile(rp, mv.up, row); reconcile(fp, mv.down, row);
    clearFl(k);
  }
  function paintDeskHead(k) {
    var m = MK[k], ix = m.idx[0], open = F.isOpen(m), v = $('#deskV');
    var s = $('#deskS'); if (s) s.innerHTML = '<span class="pill"><i class="dot' + (open ? ' on' : '') + '"></i>' + (open ? 'Market open' : 'Market closed') + ' \u00b7 ' + esc(m.hrs) + '</span>' + badge(k);
    if (v && ix.val != null && $('#dxl') && $('#dxl').style.display === 'none') {
      var f = ix.fl; v.innerHTML = bigHtml(m, ix.val); if (f) fl(v, f > 0 ? 'fl-u' : 'fl-d'); if (deskVals) deskDelta(deskVals);
    }
  }
  function renderDesk() {
    var k = deskK, m = MK[k], ix = m.idx[0];
    var row = rowHtml(k, m);
    $('#deskB').innerHTML =
      '<div class="desk__p"><div class="ph2"><span>' + esc(ix.name) + ' \u00b7 ' + esc(m.title) + '</span></div><div class="bigv" id="deskV">' + bigHtml(m, ix.val) + '</div><div class="bigd" id="deskD"></div><div class="dchart" id="deskC"></div>' +
      '<div class="rtabs" id="deskR" style="--c:var(--up)" role="group" aria-label="Range">' + ['1D', '1W', '1M', '3M', '1Y'].map(function (p) { return '<button type="button" data-p="' + p + '" aria-pressed="' + (p === deskP) + '">' + p + '</button>'; }).join('') + '</div>' +
      '<div class="dnote">Every ' + (k === 'crypto' ? 'coin' : 'company') + ' in the top 50 for ' + esc(nm(k)) + ' has its own row.<br><a href="#/' + k + '">Explore ' + esc(nm(k)) + ' \u2192</a></div></div>' +
      '<div class="desk__p"><div class="ph2"><b class="u">' + AU + 'Biggest risers</b><span>' + esc(m.label) + '</span></div><div id="deskRise"></div></div>' +
      '<div class="desk__p"><div class="ph2"><b class="d">' + AD + 'Biggest fallers</b><span>' + esc(m.label) + '</span></div><div id="deskFall"></div></div>';
    paintDeskHead(k); paintDeskLists(k); drawDesk();
  }
  function ensure(k) { return F.loadMarket(k); }

  F.views = {};
  F.views.home = function () {
    var html = '<div class="wrap"><section class="hero"><div class="hero__g"><div class="hero__c">' +
      '<span class="eyebrow"><i class="dot on"></i>Live markets, made in the UK</span><h1>Markets, beneath the surface.</h1>' +
      '<p class="sub" style="font-size:17px">The UK, US, Europe, Asia and crypto in one calm place. Prices, the top 50 companies, the day\'s big movers and what everyone is talking about.</p></div>' +
      '<div class="reef">' + candles() + '</div></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>The trading floor</h2><p>Pick a region. Risers and fallers update on their own.</p></div><div class="card desk"><div class="desk__bar"><div class="tabs" role="group" aria-label="Region" id="deskT">' +
      ORDER.map(function (k) { return '<button type="button" data-k="' + k + '" style="--c:' + MK[k].tone + '"><i></i>' + MK[k].label + '</button>'; }).join('') + '</div><span class="desk__st" id="deskS"></span></div><div class="desk__g" id="deskB"></div></div></section>' +
      '<section class="sec" id="trends"><div class="sec__h"><h2>What everyone is saying</h2><p>Topics in the news over the last day and a half</p></div><div id="trendsBox"></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>Fresh from the newsroom</h2><p>Every headline links to the original outlet</p></div><div id="newsBox"></div></section></div>';
    function paintNews() { $('#trendsBox').innerHTML = trendsHtml(); $('#newsBox').innerHTML = newsCards(F.newsFor('uk', 3).concat(F.newsFor('us', 1).filter(function (n) { return F.newsFor('uk', 3).indexOf(n) < 0; })).slice(0, 4)); }
    return {
      html: html,
      mount: function () {
        var T = $('#deskT');
        function paintTabs() { $$('button', T).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === deskK); }); }
        T.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; deskK = b.dataset.k; paintTabs(); renderDesk(); deskLive[deskK] = F.isLive(deskK); ensure(deskK); };
        $('#deskB').onclick = function (e) { var b = e.target.closest('.rtabs button'); if (!b) return; deskP = b.dataset.p; $$('button', b.parentNode).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); drawDesk(); };
        paintTabs(); renderDesk(); deskLive[deskK] = F.isLive(deskK); paintNews(); ensure(deskK);
        var rz; window.onresize = function () { clearTimeout(rz); rz = setTimeout(drawDesk, 150); };
      },
      update: function (evt) {
        if (evt === 'news') { paintNews(); return; }
        if (evt === deskK || evt === 'indices') {
          paintDeskHead(deskK); if (evt === deskK) paintDeskLists(deskK);
          var nl = F.isLive(deskK); if (deskLive[deskK] !== nl) { deskLive[deskK] = nl; drawDesk(); }
        }
      },
      tick: function () { return deskK; }
    };
  };

  /* ---------- market page ---------- */
  var state = {};
  var TABLE = function (k) {
    var isC = k === 'crypto';
    var cols = [['rank', '#', 'rk'], ['n', isC ? 'Coin' : 'Company', 'l'], ['sec', isC ? 'Category' : 'Sector', 'hide-s'], ['ix', isC ? 'Group' : (k === 'uk' ? 'Index' : 'Exchange'), 'hide-s'], ['px', 'Price', ''], ['chg', 'Today', ''], ['m1', '1 month', 'hide-s']];
    if (isC) cols.push(['cap', 'Market value (\u00a3bn)', 'hide-s']);
    cols.push(['sp', 'Trend', 'hide-s']);
    return cols;
  };
  F.views.market = function (k) {
    var m = MK[k], isC = k === 'crypto', n = noun(k), open = F.isOpen(m);
    var st = state[k] = state[k] || { ix: 0, per: '1Y', q: '', sec: '', idx: '', dir: '', sort: 'rank', asc: true };
    var cols = TABLE(k);
    var secs = Array.from(new Set(m.cos.map(function (c) { return c.sec; }))).sort(), ixs = Array.from(new Set(m.cos.map(function (c) { return c.ix; })));
    var html = '<div class="wrap"><div class="ph"><span class="ph__coin coin-bob">' + F.coin(m.coin, m.tone) + '</span><div class="ph__t"><h1>' + esc(m.name) + '</h1><div class="ph__m"><span class="pill"><i class="dot' + (open ? ' on' : '') + '"></i>' + (open ? 'Market open' : 'Market closed') + '</span><span id="mkBadge">' + badge(k) + '</span><span>' + esc(m.ex) + '</span><span>\u00b7</span><span>' + esc(m.hrs) + '</span></div></div></div>' +
      fxSection(k) +
      '<section class="sec"><div class="sec__h"><h2>' + (isC ? 'The big five' : 'Market indices') + '</h2><p>Select one to chart it below</p></div><div class="rail" id="ixrail"></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>Movers today</h2><p>Top 5 gainers and top 5 decliners among the top 50</p></div><div class="mc"><div class="card mv glow">' +
      '<div class="mv__h"><span class="ico up">' + AU + '</span><h3>Top gainers</h3><span>Riding the wave</span></div><ol id="gainL"></ol><div class="gap"></div>' +
      '<div class="mv__h" style="border-top:1px solid var(--line);margin-top:4px"><span class="ico down">' + AD + '</span><h3>Top decliners</h3><span>Taking on water</span></div><ol id="loseL"></ol></div>' +
      '<div class="card chartc glow"><div class="chartc__h"><div><h3 id="chT"></h3><div class="big" id="chV"></div></div><div class="tabs" role="group" aria-label="Time range" id="chTabs"><button type="button" data-p="1M">1M</button><button type="button" data-p="3M">3M</button><button type="button" data-p="1Y">1Y</button></div></div><div class="chart" id="chart"><div class="tip" id="tip"></div></div></div></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>The top 50 ' + n + '</h2><p>Ranked by size. Filter, search or sort any column</p></div><div class="card" style="overflow:hidden"><div class="filters">' +
      '<div class="field"><svg class="mag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="fq" type="search" placeholder="Search name or ticker" aria-label="Search"></div>' +
      '<div class="field half"><select id="fs" aria-label="' + (isC ? 'Category' : 'Sector') + '"><option value="">' + (isC ? 'All categories' : 'All sectors') + '</option>' + secs.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field half"><select id="fi" aria-label="' + cols[3][1] + '"><option value="">' + (isC ? 'All groups' : k === 'uk' ? 'All indices' : 'All exchanges') + '</option>' + ixs.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field half"><select id="fd" aria-label="Today\'s move"><option value="">Any move today</option><option value="up">Up today</option><option value="down">Down today</option><option value="big">Moved more than 2%</option></select></div>' +
      '<button class="reset" id="fr" type="button">Reset</button><span class="count" id="fc" aria-live="polite"></span></div>' +
      '<div class="tw"><table><thead><tr>' + cols.map(function (c) {
        return '<th class="' + (c[2] === 'l' ? 'l' : c[2] === 'rk' ? '' : c[2]) + '" data-k="' + c[0] + '" aria-sort="none">' + (c[0] === 'sp' ? '<span class="plain">' + c[1] + '</span>' : '<button type="button">' + c[1] + '<span class="ar">\u25b2</span></button>') + '</th>';
      }).join('') + '</tr></thead><tbody id="tb"></tbody></table></div></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>Fresh from the newsroom</h2><p>Original outlets, one tap away</p></div><div id="newsBox"></div></section></div>';

    var chartTok = 0, fxPrev = {}, lastRet = null, wasLive = F.isLive(k);
    function paintFx() {
      var d = F.convRows(k), rail = $('#fxRail'); if (!rail) return;
      rail.innerHTML = fxHtml(k, fxPrev, false); $('#fxSub').innerHTML = fxSub(k, d);
      d.rows.forEach(function (r) { fxPrev[r.to] = r.v; });
    }
    function paintIx(anim) {
      var rail = $('#ixrail'); if (!rail) return;
      rail.innerHTML = m.idx.map(function (x, i) {
        return '<button type="button" class="card ix glow" data-i="' + i + '" aria-pressed="' + (i === st.ix) + '"' + (anim ? ' style="animation:rise .5s ' + (i * .05) + 's both"' : '') + '><span class="ix__n">' + esc(x.name) + '</span><span class="ix__v' + (x.fl ? (x.fl > 0 ? ' flash-u' : ' flash-d') : '') + '">' + ixv(m, x.ok === false ? null : x.val) + '</span>' + chg(x.ok === false ? null : x.chg) + F.spark(x.sp, (x.chg || 0) >= 0, 100, 28) + '</button>';
      }).join('');
    }
    function paintMovers() {
      var mv = movers(k, 5);
      function row(c, i) { return '<li class="mr' + (c.fl ? (c.fl > 0 ? ' flash-u' : ' flash-d') : '') + '"><i>' + (i + 1) + '</i><div style="min-width:0"><b>' + esc(c.t) + '</b><span class="n">' + esc(c.n) + '</span></div><span class="num">' + px(c) + '</span>' + chg(c.chg) + '</li>'; }
      $('#gainL').innerHTML = mv.up.map(row).join(''); $('#loseL').innerHTML = mv.down.map(row).join('');
    }
    function paintNews() { $('#newsBox').innerHTML = newsCards(F.newsFor(k, 3)); }

    /* index chart */
    function drawChart() {
      var chartEl = $('#chart'); if (!chartEl) return;
      var ix = m.idx[st.ix], per = st.per, tok = ++chartTok, tip = $('#tip');
      $$('#chTabs button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.p === per); });
      $('#chT').textContent = ix.name + ' \u00b7 past ' + (per === '1M' ? 'month' : per === '3M' ? '3 months' : 'year');
      if (!$('svg', chartEl)) { var ld = $('.ld', chartEl); if (!ld) chartEl.insertAdjacentHTML('afterbegin', '<div class="ld">Loading chart\u2026</div>'); }
      F.chart(k, st.ix, per).then(function (d) {
        if (tok !== chartTok || !$('#chart')) return;
        var vals = d.v, ts = d.t, n = vals.length, ret = (vals[n - 1] / vals[0] - 1) * 100;
        lastRet = ret; $('#chV').innerHTML = ixv(m, ix.val) + chg(ret);
        var W = chartEl.clientWidth, H = chartEl.clientHeight, L = 52, R = 10, T = 10, B = 24;
        if (W < 50) return;
        var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), pad = (mx - mn) * 0.12 || 1; mn -= pad; mx += pad;
        var step = Math.pow(10, Math.floor(Math.log10((mx - mn) / 4))), f = (mx - mn) / 4 / step, ns = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * step, t0 = Math.ceil(mn / ns) * ns, ticks = [];
        for (var v = t0; v <= mx; v += ns) ticks.push(v);
        var X = function (i) { return L + i / (n - 1) * (W - L - R); }, Y = function (v) { return T + (1 - (v - mn) / (mx - mn)) * (H - T - B); };
        var path = vals.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
        var xt = [], nt = W < 480 ? 3 : 5;
        for (var q = 0; q < nt; q++) { var ii = Math.round(q / (nt - 1) * (n - 1)), dt = new Date(ts[ii]); xt.push([ii, per === '1Y' ? MONTHS[dt.getMonth()] + ' ' + String(dt.getFullYear()).slice(2) : dt.getDate() + ' ' + MONTHS[dt.getMonth()]]); }
        var dp = mx - mn > 200 ? 0 : mx - mn > 5 ? 1 : 2, pre = isC ? '\u00a3' : '';
        $$('svg, .ld', chartEl).forEach(function (e) { e.remove(); });
        chartEl.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ix.name) + ' over the past ' + per + '"><defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>' +
          ticks.map(function (t) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '" stroke="var(--line)" stroke-dasharray="3 5"/><text x="' + (L - 8) + '" y="' + (Y(t) + 4).toFixed(1) + '" text-anchor="end" font-family="Manrope,sans-serif" font-size="11" fill="var(--ink-3)">' + pre + nf(t, dp) + '</text>'; }).join('') +
          xt.map(function (t, i) { return '<text x="' + X(t[0]).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === xt.length - 1 ? 'end' : 'middle') + '" font-family="Manrope,sans-serif" font-size="11" fill="var(--ink-3)">' + t[1] + '</text>'; }).join('') +
          '<path d="' + path + 'L' + X(n - 1).toFixed(1) + ' ' + (H - B) + 'L' + L + ' ' + (H - B) + 'Z" fill="url(#ag)"/><path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
          '<g id="hv" opacity="0"><line id="hl" y1="' + T + '" y2="' + (H - B) + '" stroke="var(--ink-3)" stroke-dasharray="2 3"/><circle id="hd" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2.5"/></g>' +
          '<circle cx="' + X(n - 1).toFixed(1) + '" cy="' + Y(vals[n - 1]).toFixed(1) + '" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2.5"/></svg>');
        var hv = $('#hv'), hl = $('#hl'), hd = $('#hd');
        function move(ev) {
          var rc = chartEl.getBoundingClientRect(), x = ev.clientX - rc.left, i = Math.max(0, Math.min(n - 1, Math.round((x - L) / (W - L - R) * (n - 1))));
          hv.setAttribute('opacity', 1); hl.setAttribute('x1', X(i)); hl.setAttribute('x2', X(i)); hd.setAttribute('cx', X(i)); hd.setAttribute('cy', Y(vals[i]));
          var d2 = new Date(ts[i]), since = (vals[i] / vals[0] - 1) * 100;
          tip.innerHTML = '<small>' + d2.getDate() + ' ' + MONTHS[d2.getMonth()] + ' ' + d2.getFullYear() + '</small>' + ixv(m, vals[i]) + ' \u00b7 ' + (since >= 0 ? '+' : '') + nf(since, 2) + '%';
          tip.style.left = Math.max(60, Math.min(W - 60, X(i))) + 'px'; tip.style.top = Math.max(50, Y(vals[i])) + 'px'; tip.style.opacity = 1;
        }
        chartEl.onpointermove = move; chartEl.onpointerdown = move; chartEl.onpointerleave = function () { hv.setAttribute('opacity', 0); tip.style.opacity = 0; };
      });
    }

    /* the top-50 table */
    function tbl() {
      var tb = $('#tb'); if (!tb) return;
      var q = st.q.toLowerCase(), list = m.cos.filter(function (c) {
        return (!q || c.n.toLowerCase().indexOf(q) >= 0 || c.t.toLowerCase().indexOf(q) >= 0) && (!st.sec || c.sec === st.sec) && (!st.idx || c.ix === st.idx) &&
          (!st.dir || (st.dir === 'up' ? c.chg > 0 : st.dir === 'down' ? c.chg < 0 : Math.abs(c.chg) > 2));
      });
      var key = st.sort;
      list.sort(function (a, b) {
        var x = a[key], y = b[key];
        if (key === 'n' || key === 'sec' || key === 'ix') return st.asc ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
        x = x == null || isNaN(x) ? -Infinity : x; y = y == null || isNaN(y) ? -Infinity : y;
        return st.asc ? x - y : y - x;
      });
      tb.innerHTML = list.map(function (c) {
        var cells = '<td class="rkc">' + c.rank + '</td><td class="l"><div class="co"><b>' + esc(c.n) + '</b><small>' + esc(c.t) + '</small></div></td><td class="hide-s"><span class="sect">' + esc(c.sec) + '</span></td><td class="hide-s">' + esc(c.ix) + '</td><td class="num">' + px(c) + '</td><td>' + chg(c.ok ? c.chg : null) + '</td><td class="hide-s num ' + (c.m1 >= 0 ? 'txt-up' : 'txt-down') + '">' + (c.m1 == null ? '\u2013' : (c.m1 >= 0 ? '+' : '') + nf(c.m1, 1) + '%') + '</td>';
        if (isC) cells += '<td class="hide-s num">' + (c.cap == null ? '\u2013' : nf(c.cap, c.cap < 10 ? 1 : 0)) + '</td>';
        cells += '<td class="hide-s" style="width:100px">' + F.spark(c.sp, (c.m1 || 0) >= 0, 72, 22) + '</td>';
        return '<tr' + (c.fl ? ' class="' + (c.fl > 0 ? 'flash-u' : 'flash-d') + '"' : '') + '>' + cells + '</tr>';
      }).join('') || '<tr><td colspan="9" class="empty">Nothing matches those filters. Try Reset.</td></tr>';
      $('#fc').textContent = 'Showing ' + list.length + ' of ' + m.cos.length;
      $$('th[data-k]').forEach(function (t) { t.setAttribute('aria-sort', t.dataset.k === st.sort ? (st.asc ? 'ascending' : 'descending') : 'none'); var a = $('.ar', t); if (a) a.textContent = st.asc ? '\u25b2' : '\u25bc'; });
    }

    return {
      html: html,
      mount: function () {
        paintIx(true); paintMovers(); paintNews(); tbl(); drawChart();
        $('#ixrail').onclick = function (e) { var b = e.target.closest('.ix'); if (!b) return; st.ix = +b.dataset.i; $$('#ixrail .ix').forEach(function (c, i) { c.setAttribute('aria-pressed', i === st.ix); }); drawChart(); };
        $('#chTabs').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; st.per = b.dataset.p; drawChart(); };
        $$('th[data-k] button').forEach(function (b) { b.onclick = function () { var kk = b.parentNode.dataset.k; if (st.sort === kk) st.asc = !st.asc; else { st.sort = kk; st.asc = kk === 'n' || kk === 'sec' || kk === 'ix' || kk === 'rank'; } tbl(); }; });
        var fq = $('#fq'), fs = $('#fs'), fi = $('#fi'), fd = $('#fd');
        fq.value = st.q; fs.value = st.sec; fi.value = st.idx; fd.value = st.dir;
        fq.oninput = function () { st.q = fq.value; tbl(); }; fs.onchange = function () { st.sec = fs.value; tbl(); }; fi.onchange = function () { st.idx = fi.value; tbl(); }; fd.onchange = function () { st.dir = fd.value; tbl(); };
        $('#fr').onclick = function () { st.q = st.sec = st.idx = st.dir = ''; fq.value = fs.value = fi.value = fd.value = ''; tbl(); };
        var rz; window.onresize = function () { clearTimeout(rz); rz = setTimeout(drawChart, 150); };
        F.loadMarket(k); F.loadFx(k);
      },
      update: function (evt) {
        if (evt === 'news') { paintNews(); return; }
        if (evt === 'fx') { paintFx(); return; }
        if (evt === k) {
          paintIx(false); paintMovers(); tbl(); var b = $('#mkBadge'); if (b) b.innerHTML = badge(k);
          if (k === 'crypto') paintFx();
          var nowLive = F.isLive(k);
          if (nowLive !== wasLive) { wasLive = nowLive; drawChart(); }
          else if (lastRet != null && $('#chV')) $('#chV').innerHTML = ixv(m, m.idx[st.ix].val) + chg(lastRet);
          clearFl(k);
        }
      },
      tick: function () { return k; }
    };
  };
})();
