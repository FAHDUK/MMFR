/* FRMM core: small helpers shared by everything else. */
(function () {
  'use strict';
  var F = window.FRMM = window.FRMM || {};

  F.$ = function (s, r) { return (r || document).querySelector(s); };
  F.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  F.rng = function (seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  F.hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  F.gauss = function (r) { return Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r()); };
  F.nf = function (n, dp) { return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp }); };
  F.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  F.safeUrl = function (u) { return /^https?:\/\//i.test(u || '') ? u : '#'; };

  F.ARROW_U = '<svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M5 1l4 7H1z"/></svg>';
  F.ARROW_D = '<svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M5 9L1 2h8z"/></svg>';

  /* percentage pill */
  F.chg = function (p, dp) {
    if (p == null || isNaN(p)) return '<span class="chg none">\u2013</span>';
    var up = p >= 0;
    return '<span class="chg ' + (up ? 'up' : 'down') + '">' + (up ? F.ARROW_U : F.ARROW_D) + F.nf(Math.abs(p), dp == null ? 2 : dp) + '%</span>';
  };
  F.pcs = function (v) { return (v >= 0 ? '+' : '\u2212') + F.nf(Math.abs(v), 2) + '%'; };

  /* price text for one company or coin */
  F.px = function (c) {
    if (c.px == null || isNaN(c.px)) return 'n/a';
    var v = c.px;
    if (c.cur === 'p') return F.nf(v, v >= 1000 ? 0 : 1) + 'p';
    var dp = (c.cur === '\u00a5' || c.cur === '\u20a9') ? 0 : v >= 10000 ? 0 : v >= 1 ? 2 : v >= 0.01 ? 4 : 8;
    return (c.cur || '') + F.nf(v, dp);
  };
  /* index value text */
  F.ixv = function (m, v) {
    if (v == null || isNaN(v)) return 'n/a';
    return m.k === 'crypto' ? '\u00a3' + F.nf(v, v < 100 ? 2 : 0) : F.nf(v, 1);
  };
  F.fv = function (v) { return v >= 1000 ? F.nf(v, 0) : v >= 100 ? F.nf(v, 2) : v >= 1 ? F.nf(v, 4) : F.nf(v, 5); };

  /* mini line chart */
  F.spark = function (vals, up, w, h) {
    if (!vals || vals.length < 2) return '';
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), sp = (mx - mn) || 1, n = vals.length;
    var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + (i / (n - 1) * w).toFixed(1) + ' ' + (h - 2 - (v - mn) / sp * (h - 4)).toFixed(1); }).join('');
    var col = up ? 'var(--up)' : 'var(--down)';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + 'L' + w + ' ' + h + 'L0 ' + h + 'Z" fill="' + col + '" opacity=".12"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  };

  /* a made-up but repeatable price path that ends at 1 + endChg% (demo mode only) */
  F.series = function (seed, n, endChg, w) {
    var r = F.rng(F.hash(seed)), out = [], i, s = 0, walk = [0];
    for (i = 1; i < n; i++) { s += F.gauss(r) * 0.6; walk.push(s); }
    for (i = 0; i < n; i++) { var t = i / (n - 1); out[i] = 1 + endChg / 100 * t + (walk[i] - t * walk[n - 1]) * (w || 0.012); }
    return out;
  };

  /* is the market open right now */
  F.isOpen = function (m) {
    if (!m.open) return true;
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: m.tz, hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false }).formatToParts(new Date());
    var g = {}; p.forEach(function (x) { g[x.type] = x.value; });
    if (g.weekday === 'Sat' || g.weekday === 'Sun') return false;
    var mins = (+g.hour % 24) * 60 + +g.minute;
    return mins >= m.open[0] * 60 + m.open[1] && mins < m.open[2] * 60 + m.open[3];
  };

  /* the friendly coin mascots. Plain SVG, so every phone draws them the same way. */
  F.coin = function (sym, color) {
    var ink = '#0a1a30', sy;
    if (sym === 'B') sy = '<text x="32" y="46" text-anchor="middle" font-family="Sora,Arial,sans-serif" font-weight="800" font-size="28" fill="' + ink + '">B</text><path d="M28.5 21v5M35.5 21v5M28.5 47v5M35.5 47v5" stroke="' + ink + '" stroke-width="2.6" stroke-linecap="round"/>';
    else sy = '<text x="32" y="47" text-anchor="middle" font-family="Sora,Arial,sans-serif" font-weight="800" font-size="30" fill="' + ink + '">' + sym + '</text>';
    return '<svg class="coin" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="37" r="26" fill="' + color + '"/><path d="M32 63a26 26 0 0 0 23-38 26 26 0 0 1-42 30 26 26 0 0 0 19 8z" fill="#000" opacity=".14"/><circle cx="32" cy="37" r="20" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="2" stroke-dasharray="2.5 3.2"/>' + sy +
      '<g stroke="' + ink + '" stroke-width="2.2"><ellipse cx="23" cy="13" rx="6.4" ry="7.4" fill="#fff"/><ellipse cx="41" cy="13" rx="6.4" ry="7.4" fill="#fff"/></g><circle class="pupil" cx="24" cy="14" r="2.7" fill="' + ink + '"/><circle class="pupil" cx="42" cy="14" r="2.7" fill="' + ink + '"/></svg>';
  };

  /* cache that never throws (private windows, blocked storage) */
  F.cache = {
    get: function (k, maxAgeMs) {
      try { var o = JSON.parse(localStorage.getItem('frmm.' + k)); if (o && (maxAgeMs == null || Date.now() - o.t < maxAgeMs)) return o.v; } catch (e) { /* ignore */ }
      return null;
    },
    set: function (k, v) { try { localStorage.setItem('frmm.' + k, JSON.stringify({ t: Date.now(), v: v })); } catch (e) { /* ignore */ } }
  };

  /* fetch with a timeout; resolves JSON */
  F.getJSON = function (url, ms) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = ctl && setTimeout(function () { ctl.abort(); }, ms || 12000);
    return fetch(url, ctl ? { signal: ctl.signal } : undefined).then(function (r) {
      if (to) clearTimeout(to);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }, function (e) { if (to) clearTimeout(to); throw e; });
  };
})();
