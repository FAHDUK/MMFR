/* FRMM core: config, key, tiny event bus, formatters, session cache */
(function () {
  'use strict';

  var F = window.FRMM = window.FRMM || {};
  var CFG = Object.assign({
    FINNHUB_KEY: '', COINS_REFRESH_MS: 45000, NEWS_REFRESH_MS: 6 * 60 * 1000, FINNHUB_SPACING_MS: 1100
  }, window.FRMM_CONFIG || {});
  F.cfg = CFG;

  /* ---------- audience view: professional by default, remembered locally ---------- */
  var VIEW = 'pro';
  try {
    var savedView = localStorage.getItem('frmm.view');
    if (savedView === 'explore' || savedView === 'pro') VIEW = savedView;
  } catch (e) { /* storage blocked */ }
  F.view = VIEW;
  document.documentElement.setAttribute('data-view', VIEW);
  F.setView = function (next) {
    if (next !== 'pro' && next !== 'explore') return;
    F.view = next;
    document.documentElement.setAttribute('data-view', next);
    try { localStorage.setItem('frmm.view', next); } catch (e) { /* storage blocked */ }
    F.emit('view', next);
  };
  F.copy = function (pro, explore) {
    return '<span class="copy copy--pro">' + F.esc(pro) + '</span><span class="copy copy--explore">' + F.esc(explore) + '</span>';
  };

  /* ---------- Finnhub key: this browser's saved key wins over config.js ---------- */
  var KEY = CFG.FINNHUB_KEY || '';
  F.keySource = KEY ? 'config' : 'none';
  try {
    var saved = localStorage.getItem('frmm.finnhubKey');
    if (saved) { KEY = saved; F.keySource = 'browser'; }
  } catch (e) { /* storage blocked */ }
  F.key = (KEY || '').trim();

  /* ---------- event bus ---------- */
  var handlers = {};
  F.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  F.emit = function (ev, data) {
    (handlers[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } });
  };

  /* ---------- small helpers ---------- */
  F.$ = function (id) { return document.getElementById(id); };
  F.each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  F.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  F.rand = function (a, b) { return a + Math.random() * (b - a); };
  F.gauss = function () { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2; };
  F.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  F.safeUrl = function (u) {
    try { var x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : null; } catch (e) { return null; }
  };

  /* ---------- number formatting (UK style) ---------- */
  function r2(n) { return Math.round(n * 100) / 100; }
  F.fmtPrice = function (n, cur) {
    if (n == null || !isFinite(n)) return '--';
    var a = Math.abs(n), d = a >= 100 ? 2 : a >= 1 ? 2 : a >= 0.1 ? 4 : 6;
    return (cur || '') + n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  F.fmtPct = function (n, abs) {
    if (n == null || !isFinite(n)) return '--';
    var v = Math.abs(r2(n)).toFixed(2) + '%';
    return abs ? v : ((r2(n) > 0 ? '+' : r2(n) < 0 ? '-' : '') + v);
  };
  F.dir = function (n) { return r2(n) > 0 ? 'up' : r2(n) < 0 ? 'down' : 'flat'; };
  var compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 2 });
  F.fmtCompact = function (n, cur) { return (n == null || !isFinite(n)) ? '--' : (cur || '') + compact.format(n); };
  F.timeAgo = function (ts) {
    if (!ts) return '';
    var s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' d ago';
  };
  F.clock = function (tz) {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) { return ''; }
  };

  /* ---------- session cache with a time limit (keeps page-to-page navigation quick and
     stays well inside free-plan rate limits) ---------- */
  F.cache = {
    get: function (k, maxAgeMs) {
      try {
        var raw = sessionStorage.getItem('frmm.' + k); if (!raw) return null;
        var o = JSON.parse(raw);
        if (maxAgeMs && Date.now() - o.t > maxAgeMs) return null;
        return o.v;
      } catch (e) { return null; }
    },
    set: function (k, v) {
      try { sessionStorage.setItem('frmm.' + k, JSON.stringify({ t: Date.now(), v: v })); } catch (e) { /* full or blocked */ }
    }
  };
})();
