/* FRMM app: router, top strip, live badge and the refresh loops. */
(function () {
  'use strict';
  var F = window.FRMM, MK = F.MK, ORDER = F.ORDER, $ = F.$, $$ = F.$$, esc = F.esc, nf = F.nf;
  var app = $('#app'), current = null, curKey = 'home';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* glowing specks in the background, each on its own slow rhythm */
  (function () {
    var r = F.rng(2024), n = window.innerWidth < 720 ? 36 : 72, i, h = '';
    for (i = 0; i < n; i++) h += '<i class="spk" style="--x:' + (r() * 100).toFixed(1) + '%;--y:' + (r() * 100).toFixed(1) + '%;--s:' + (2 + r() * 2.8).toFixed(1) + 'px;--d:' + (9 + r() * 12).toFixed(1) + 's;--dl:-' + (r() * 21).toFixed(1) + 's"></i>';
    $('#sky').innerHTML = h;
  })();

  function paintNav(route) {
    var items = [['home', 'Home', '#/', '#5b8cff']].concat(ORDER.map(function (k) { return [k, MK[k].label, '#/' + k, MK[k].tone]; }));
    $('#nav').innerHTML = items.map(function (i) { return '<a href="' + i[2] + '" style="--c:' + i[3] + '"' + (i[0] === route ? ' aria-current="page"' : '') + '><i></i>' + i[1] + '</a>'; }).join('');
  }

  /* top strip: built once, then only the numbers change, so the scroll never jumps */
  var stripBuilt = false;
  function stripItems() {
    var out = ORDER.map(function (k) { var x = MK[k].idx[0]; return { id: k, name: x.name, val: x.val == null ? '' : F.ixv(MK[k], x.val), chg: x.chg }; });
    var fx = F.convRows('uk').rows.slice(0, 3);
    fx.forEach(function (r) { out.push({ id: 'fx' + r.to, name: '\u00a3/' + r.to, val: F.fv(r.v), chg: r.chg }); });
    return out.filter(function (o) { return o.chg != null; });
  }
  function paintStrip() {
    var items = stripItems(), box = $('#stripT');
    if (!items.length) return;
    if (!stripBuilt) {
      var one = items.map(function (o) { return '<span class="tk" data-id="' + o.id + '"><b>' + esc(o.name) + '</b><span class="num"></span><span class="ch"></span></span>'; }).join('');
      box.innerHTML = one + one; stripBuilt = true;
    }
    items.forEach(function (o) {
      $$('[data-id="' + o.id + '"]', box).forEach(function (e) {
        $('.num', e).textContent = o.val;
        var c = $('.ch', e); c.className = 'ch ' + (o.chg >= 0 ? 'u' : 'd'); c.textContent = (o.chg >= 0 ? '\u25b2' : '\u25bc') + nf(Math.abs(o.chg), 2) + '%';
      });
    });
  }

  function paintBadge() {
    var stocks = ['uk', 'us', 'europe', 'asia'].some(function (k) { return F.isLive(k) || MK[k].idx[0].live; }), coins = F.isLive('crypto'), b = $('#badge'), note = $('#footNote');
    var txt = stocks ? 'Live, delayed' : coins ? 'Live crypto, demo shares' : 'Demo data';
    b.className = 'badge ' + (stocks ? 'live' : 'demo'); b.innerHTML = '<i class="dot"></i>' + txt;
    note.textContent = stocks
      ? 'Information only, not financial advice. Share prices are delayed. Data from Yahoo Finance, CoinGecko and the ECB.'
      : 'Information only, not financial advice. Demo numbers are shown for shares until a live feed is connected.';
  }

  F.onData = function (evt) {
    paintStrip(); paintBadge();
    if (current && current.update) current.update(evt);
  };

  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/'), r = parts[0] || 'home';
    curKey = MK[r] ? r : 'home';
    if (current && current.destroy) current.destroy();
    window.onresize = null;
    current = MK[r] ? F.views.market(r) : F.views.home();
    paintNav(curKey);
    app.style.animation = 'none'; void app.offsetWidth; app.style.animation = '';
    app.innerHTML = current.html;
    current.mount();
    paintStrip(); paintBadge();
    var tgt = parts[1] === 'trends' && $('#trends');
    if (tgt) tgt.scrollIntoView(); else window.scrollTo(0, 0);
    document.title = (MK[r] ? MK[r].label + ' | ' : '') + 'FRMM | Markets, beneath the surface';
  }
  window.addEventListener('hashchange', route);

  /* pointer-following glow */
  var raf = 0;
  document.addEventListener('pointermove', function (e) {
    var el = e.target.closest && e.target.closest('.glow'); if (!el || raf) return;
    raf = requestAnimationFrame(function () { raf = 0; var b = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - b.left) + 'px'); el.style.setProperty('--my', (e.clientY - b.top) + 'px'); });
  }, { passive: true });

  /* start */
  route();
  F.loadIndices();
  F.loadMarket('crypto');
  F.loadFx('uk');
  function news() { return F.loadNews().then(function () { if (current && current.update) current.update('news'); }); }
  news();

  /* real refresh: pull fresh quotes for the page you are on */
  setInterval(function () {
    if (document.hidden) return;
    F.loadIndices();
    F.loadMarket(curKey === 'home' ? 'uk' : curKey, true);
    if (curKey !== 'home' && curKey !== 'crypto') F.loadMarket('crypto', true);
  }, Math.max(20, F.CONFIG.REFRESH_SECONDS || 60) * 1000);
  setInterval(function () { if (!document.hidden) { try { localStorage.removeItem('frmm.news'); } catch (e) { /* ignore */ } news(); } }, 10 * 60 * 1000);

  /* demo mode only: gentle simulated ticks so the floor still feels alive */
  if (!reduce) setInterval(function () {
    if (document.hidden || !current || !current.tick) return;
    var k = current.tick();
    if (F.isLive(k) || !MK[k].have) return;
    F.tickDemo(k, 2);
    if (current.update) current.update(k);
  }, 2200);
})();
