/* FRMM ui: shared header, ticker strip, footer, mascots, glowing specks, reveals, key settings */
(function () {
  'use strict';

  var F = window.FRMM, $ = F.$, esc = F.esc;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the ponds (pages) ---------- */
  var PAGES = F.PAGES = {
    home: { href: 'index.html', label: 'Home', color: '#ff6b81' },
    uk: { href: 'uk.html', label: 'UK', color: '#ff5468' },
    us: { href: 'us.html', label: 'US', color: '#3d9bff' },
    europe: { href: 'europe.html', label: 'Europe', color: '#ffd23f' },
    asia: { href: 'asia.html', label: 'Asia', color: '#b98cff' },
    crypto: { href: 'crypto.html', label: 'Crypto', color: '#ff8a3d' },
    trends: { href: 'trends.html', label: 'Trends', color: '#c8f542' }
  };
  var page = document.body.getAttribute('data-page') || 'home';
  F.page = page;
  document.documentElement.style.setProperty('--accent', (PAGES[page] || PAGES.home).color);

  /* ---------- mascots: original sticker-style sea creatures, one per pond ---------- */
  var CREAM = '#fff4de', INK = '#0b1f4a';
  function line(d, color, w, out) {
    return '<path d="' + d + '" fill="none" stroke="' + CREAM + '" stroke-width="' + (w + out * 2) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function shape(tag, attrs, fill) {
    return '<' + tag + ' ' + attrs + ' fill="' + fill + '" stroke="' + CREAM + '" stroke-width="7" stroke-linejoin="round" paint-order="stroke"/>';
  }
  function eye(x, y, r, dx) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" stroke="' + INK + '" stroke-width="3"/><circle cx="' + (x + (dx || 0)) + '" cy="' + (y + 1) + '" r="' + (r * 0.5) + '" fill="' + INK + '"/><circle cx="' + (x + (dx || 0) - r * 0.18) + '" cy="' + (y - r * 0.2) + '" r="' + (r * 0.16) + '" fill="#fff"/>';
  }
  function svg(inner) { return '<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + inner + '</svg>'; }

  var MASCOTS = {
    /* Home: a flowing red-and-blue betta, drawn in the same sticker style as the pond mascots */
    home: function () {
      return svg(
        shape('path', 'd="M68 112 C48 78 24 60 10 72 C24 94 24 130 10 150 C26 160 50 144 70 120 Z"', '#3d78ff') +
        shape('path', 'd="M78 88 C66 58 92 34 126 48 C112 66 102 80 98 94 Z"', '#6d8dff') +
        shape('path', 'd="M80 138 C70 170 106 194 144 170 C124 158 110 146 100 132 Z"', '#315ed0') +
        shape('ellipse', 'cx="120" cy="112" rx="66" ry="44"', '#ff6b81') +
        '<path d="M78 84 C90 100 94 126 82 144" fill="none" stroke="#3d78ff" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M96 74 C108 94 112 130 100 150" fill="none" stroke="#5f80ff" stroke-width="8" stroke-linecap="round" opacity=".95"/>' +
        '<ellipse cx="124" cy="137" rx="38" ry="14" fill="#ff9caf" opacity=".55"/>' +
        eye(148, 101, 13, 3) +
        '<circle cx="140" cy="122" r="6" fill="#ffb3bf" opacity=".85"/>' +
        '<path d="M154 126 Q166 132 176 124" fill="none" stroke="#7a2338" stroke-width="4" stroke-linecap="round"/>' +
        '<g fill="' + CREAM + '" opacity=".62"><circle cx="108" cy="98" r="3.5"/><circle cx="118" cy="88" r="3"/><circle cx="124" cy="108" r="3.5"/><circle cx="106" cy="122" r="3"/></g>'
      );
    },
    /* UK: a plump red fish in a bowler hat, with a moustache and a brolly */
    uk: function () {
      return svg(
        shape('polygon', 'points="52,116 12,80 16,150"', '#d93a55') +
        shape('polygon', 'points="84,72 104,44 128,74"', '#d93a55') +
        shape('ellipse', 'cx="104" cy="118" rx="70" ry="52"', '#ff5468') +
        '<path d="M64 92 C60 112 60 126 64 146" fill="none" stroke="' + CREAM + '" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M84 72 C78 100 78 136 84 164" fill="none" stroke="#4d6dff" stroke-width="7" stroke-linecap="round"/>' +
        '<ellipse cx="112" cy="146" rx="40" ry="18" fill="#ff9aa8" opacity=".55"/>' +
        eye(134, 106, 13, 3) +
        '<path d="M128 132 C140 126 150 130 156 138 C146 142 136 142 128 132 Z" fill="#1b2a52"/>' +
        '<path d="M126 148 Q138 156 152 146" fill="none" stroke="#7a2338" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="112" cy="128" r="7" fill="#ff9aa8" opacity=".8"/>' +
        shape('ellipse', 'cx="120" cy="66" rx="34" ry="8"', '#1b2a52') +
        shape('path', 'd="M100 66 C100 34 140 34 140 66 Z"', '#1b2a52') +
        '<rect x="100" y="55" width="40" height="7" fill="#ff5468"/>'
      );
    },
    /* US: a puffed-up pufferfish with stars */
    us: function () {
      var spikes = '', i, a;
      for (i = 0; i < 16; i++) {
        a = i * Math.PI * 2 / 16;
        var cx = 108 + Math.cos(a) * 62, cy = 112 + Math.sin(a) * 62, tx = 108 + Math.cos(a) * 84, ty = 112 + Math.sin(a) * 84;
        var lx = 108 + Math.cos(a - 0.14) * 62, ly = 112 + Math.sin(a - 0.14) * 62, rx = 108 + Math.cos(a + 0.14) * 62, ry = 112 + Math.sin(a + 0.14) * 62;
        spikes += '<polygon points="' + lx.toFixed(1) + ',' + ly.toFixed(1) + ' ' + tx.toFixed(1) + ',' + ty.toFixed(1) + ' ' + rx.toFixed(1) + ',' + ry.toFixed(1) + '" fill="#ffd166" stroke="' + CREAM + '" stroke-width="5" stroke-linejoin="round"/>';
      }
      return svg(
        shape('polygon', 'points="48,112 12,80 14,146"', '#1f6fd6') + spikes +
        shape('circle', 'cx="108" cy="112" r="62"', '#3d9bff') +
        '<ellipse cx="108" cy="146" rx="40" ry="24" fill="#b6dcff"/>' +
        shape('ellipse', 'cx="92" cy="128" rx="14" ry="8" transform="rotate(20 92 128)"', '#1f6fd6') +
        eye(88, 96, 14, 2) + eye(128, 96, 14, -2) +
        '<ellipse cx="108" cy="126" rx="7" ry="9" fill="#7a2338" stroke="' + INK + '" stroke-width="3"/>' +
        '<circle cx="70" cy="118" r="7" fill="#ff9aa8" opacity=".85"/><circle cx="146" cy="118" r="7" fill="#ff9aa8" opacity=".85"/>' +
        '<g fill="#fff"><path d="M108 58l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/></g>'
      );
    },
    /* Europe: an octopus in a beret with a curly moustache */
    europe: function () {
      var tent = ['M72 132 C40 150 52 180 30 190', 'M90 142 C74 170 88 192 68 206', 'M108 146 C108 174 122 188 110 210', 'M126 142 C142 168 130 192 150 206', 'M144 132 C174 150 162 180 184 190'];
      return svg(
        tent.map(function (d) { return line(d, '#ffc93c', 20, 5); }).join('') +
        shape('circle', 'cx="108" cy="92" r="58"', '#ffc93c') +
        '<g fill="#ffe28a"><circle cx="68" cy="176" r="3.5"/><circle cx="52" cy="166" r="3.5"/><circle cx="122" cy="186" r="3.5"/><circle cx="148" cy="186" r="3.5"/></g>' +
        eye(86, 98, 13, 2) + eye(128, 98, 13, -2) +
        '<path d="M92 128 C100 122 106 128 108 128 C110 128 116 122 124 128" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M96 136 Q108 144 120 136" fill="none" stroke="#7a2338" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="66" cy="118" r="7" fill="#ff9aa8" opacity=".8"/><circle cx="150" cy="118" r="7" fill="#ff9aa8" opacity=".8"/>' +
        shape('ellipse', 'cx="104" cy="46" rx="44" ry="16" transform="rotate(-8 104 46)"', '#e63946') +
        shape('circle', 'cx="112" cy="28" r="5"', '#e63946')
      );
    },
    /* Asia: a glowing jellyfish */
    asia: function () {
      var tents = ['M62 118 C48 140 76 156 60 184', 'M86 122 C74 146 100 164 84 200', 'M110 124 C100 150 124 168 112 206', 'M134 122 C124 146 148 164 138 198', 'M158 118 C146 140 172 156 160 184'];
      var dots = '';
      for (var i = 0; i < 6; i++) dots += '<circle cx="' + (60 + i * 20) + '" cy="' + (66 + (i % 2) * 8) + '" r="' + (3 + (i % 3)) + '" fill="#fff" opacity=".55"/>';
      return svg(
        '<defs><radialGradient id="jg" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#e6d4ff" stop-opacity=".9"/><stop offset="1" stop-color="#b98cff" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="110" cy="100" r="96" fill="url(#jg)" opacity=".55"/>' +
        tents.map(function (d) { return line(d, '#d9c1ff', 9, 4); }).join('') +
        shape('path', 'd="M34 118 C30 40 190 40 186 118 C176 126 168 112 158 122 C148 132 140 114 130 124 C120 134 100 134 90 124 C80 114 72 132 62 122 C52 112 44 126 34 118 Z"', '#b98cff') +
        dots +
        eye(88, 94, 12, 2) + eye(132, 94, 12, -2) +
        '<path d="M100 112 Q110 120 120 112" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="70" cy="108" r="6" fill="#ff9aa8" opacity=".8"/><circle cx="150" cy="108" r="6" fill="#ff9aa8" opacity=".8"/>'
      );
    },
    /* Crypto: a crab holding a coin */
    crypto: function () {
      var legs = ['M62 132 L26 150', 'M66 146 L36 176', 'M80 156 L58 192', 'M158 132 L194 150', 'M154 146 L184 176', 'M140 156 L162 192'];
      return svg(
        legs.map(function (d) { return line(d, '#ff6b3d', 9, 4); }).join('') +
        line('M62 108 L34 78', '#ff6b3d', 12, 4) + line('M158 108 L190 82', '#ff6b3d', 12, 4) +
        shape('path', 'd="M40 84 C8 80 8 40 34 34 C30 48 38 54 46 52 C52 64 46 76 40 84 Z"', '#ff6b3d') +
        line('M96 96 L92 68', '#ff6b3d', 8, 4) + line('M124 96 L128 68', '#ff6b3d', 8, 4) +
        shape('ellipse', 'cx="110" cy="128" rx="64" ry="44"', '#ff6b3d') +
        eye(92, 64, 11, 1) + eye(128, 64, 11, -1) +
        '<path d="M92 138 Q110 154 128 138" fill="none" stroke="#7a2338" stroke-width="5" stroke-linecap="round"/>' +
        '<circle cx="76" cy="126" r="7" fill="#ffb199" opacity=".9"/><circle cx="144" cy="126" r="7" fill="#ffb199" opacity=".9"/>' +
        shape('path', 'd="M180 92 C210 92 214 54 186 44 C190 58 182 64 174 62 C168 74 174 86 180 92 Z"', '#ff6b3d') +
        '<g><circle cx="190" cy="34" r="22" fill="#ffc93c" stroke="' + CREAM + '" stroke-width="5"/><circle cx="190" cy="34" r="15" fill="none" stroke="#c98a10" stroke-width="2"/>' +
        '<text x="190" y="41" text-anchor="middle" font-size="20" font-weight="800" fill="#8a5a06" font-family="DM Sans, Arial, sans-serif">B</text>' +
        '<path d="M186 15v6M194 15v6M186 47v6M194 47v6" stroke="#8a5a06" stroke-width="2" stroke-linecap="round"/></g>'
      );
    },
    /* Trends: an anglerfish with a glowing lure */
    trends: function () {
      var teeth = '';
      for (var i = 0; i < 5; i++) teeth += '<polygon points="' + (138 + i * 12) + ',118 ' + (144 + i * 12) + ',132 ' + (150 + i * 12) + ',118" fill="' + CREAM + '"/>';
      for (i = 0; i < 4; i++) teeth += '<polygon points="' + (142 + i * 12) + ',152 ' + (148 + i * 12) + ',140 ' + (154 + i * 12) + ',152" fill="' + CREAM + '"/>';
      return svg(
        '<defs><radialGradient id="ag" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e9ff8a"/><stop offset="1" stop-color="#c8f542" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="158" cy="30" r="34" fill="url(#ag)"/>' +
        line('M118 78 C126 34 150 22 158 30', '#0b1f4a', 5, 4) +
        shape('polygon', 'points="36,124 6,92 6,158"', '#14606f') +
        shape('polygon', 'points="92,72 108,46 124,74"', '#14606f') +
        shape('ellipse', 'cx="108" cy="124" rx="78" ry="56"', '#1d8aa1') +
        '<ellipse cx="96" cy="150" rx="50" ry="22" fill="#5fc4d6" opacity=".7"/>' +
        '<path d="M150 124 C182 108 204 134 184 164 C160 176 136 158 150 124 Z" fill="#0b1f4a" stroke="' + CREAM + '" stroke-width="5" stroke-linejoin="round"/>' + teeth +
        '<path d="M156 146 Q166 160 178 150 Q170 140 156 146 Z" fill="#ff7d8c"/>' +
        '<circle cx="158" cy="30" r="10" fill="#c8f542" stroke="' + CREAM + '" stroke-width="4"/>' +
        eye(122, 100, 15, 3) +
        '<path d="M106 84 Q122 76 136 86" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
        '<g fill="' + CREAM + '" opacity=".7"><circle cx="70" cy="108" r="4"/><circle cx="60" cy="126" r="3"/><circle cx="76" cy="132" r="3"/></g>'
      );
    }
  };
  F.mascot = function (id) { return MASCOTS[id] ? MASCOTS[id]() : ''; };

  /* ---------- one creature slot, two visual languages ---------- */
  var PRO_FISH = {
    home: ['assets/pro/home-betta.webp', 'Red and blue betta fish'],
    uk: ['assets/pro/uk-atlantic-salmon.webp', 'Atlantic salmon'],
    us: ['assets/pro/us-striped-bass.webp', 'Striped bass'],
    europe: ['assets/pro/europe-sea-bass.webp', 'European sea bass'],
    asia: ['assets/pro/asia-koi.webp', 'Kohaku koi'],
    crypto: ['assets/pro/crypto-blue-discus.webp', 'Electric blue discus fish'],
    trends: ['assets/pro/trends-anglerfish.webp', 'Deep-sea anglerfish']
  };
  F.creature = function (id) {
    var fish = PRO_FISH[id] || PRO_FISH.home;
    return '<img class="creature creature--pro" src="' + fish[0] + '" alt="' + esc(fish[1]) + '" loading="' + (id === 'home' ? 'eager' : 'lazy') + '">' +
      '<span class="creature creature--explore" aria-hidden="true">' + (MASCOTS[id] ? MASCOTS[id]() : WAVE) + '</span>';
  };

  /* ---------- wave mark ---------- */
  var WAVE = '<svg viewBox="0 0 62 50" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M3 10c5-7 10-7 14 0s9 7 14 0 10-7 14 0 7 5 11 2"/><path d="M3 22c5-7 10-7 14 0s9 7 14 0 10-7 14 0 7 5 11 2" opacity=".78"/><path d="M3 34c5-7 10-7 14 0s9 7 14 0 10-7 14 0 7 5 11 2" opacity=".56"/><path d="M3 46c5-7 10-7 14 0s9 7 14 0 10-7 14 0 7 5 11 2" opacity=".34"/></svg>';
  F.WAVE = WAVE;

  /* ---------- header, drawer, ticker strip, footer ---------- */
  var order = ['home', 'uk', 'us', 'europe', 'asia', 'crypto', 'trends'];
  function navLinks(cls) {
    return order.map(function (k) {
      var p = PAGES[k];
      return '<a class="' + cls + (k === page ? ' is-active' : '') + '" href="' + p.href + '" style="--c:' + p.color + '"' + (k === page ? ' aria-current="page"' : '') + '><i></i><span>' + p.label + '</span></a>';
    }).join('');
  }

  var TICK = [
    ['q', 'EWU', 'UK'], ['fx', 'USD', '£/$'], ['fx', 'EUR', '£/€'], ['q', 'SPY', 'S&P 500'], ['q', 'QQQ', 'Nasdaq'], ['q', 'FEZ', 'Euro Stoxx'],
    ['q', 'EWJ', 'Japan'], ['c', 'btc', 'Bitcoin'], ['c', 'eth', 'Ethereum'], ['q', 'GLD', 'Gold'], ['q', 'USO', 'Oil']
  ];
  F.TICK_SYMS = TICK.filter(function (t) { return t[0] === 'q'; }).map(function (t) { return t[1]; });

  function buildChrome() {
    var top = document.createElement('header');
    top.className = 'top'; top.id = 'top';
    top.innerHTML =
      '<div class="top__bar">' +
      '<a class="brand" href="index.html" aria-label="FRMM home"><span class="brand__mark">' + WAVE + '</span><span class="brand__text"><b>FRMM</b><span>Markets, beneath the surface</span></span></a>' +
      '<nav class="nav" aria-label="Ponds">' + navLinks('nav__a') + '</nav>' +
      '<div class="top__actions"><div class="view-switch" role="group" aria-label="Choose site view"><span class="view-switch__label">View</span><button type="button" data-view-choice="pro">Pro</button><button type="button" data-view-choice="explore">Explore</button></div>' +
      '<button class="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button></div>' +
      '</div>' +
      '<div class="strip" aria-label="Market ticker"><span class="strip__badge" id="stripBadge"><i></i><span>LIVE</span></span><span class="strip__mask"><span class="strip__track" id="stripTrack"></span></span></div>';
    document.body.insertBefore(top, document.body.firstChild);

    var specks = document.createElement('div');
    specks.id = 'specks'; specks.className = 'specks'; specks.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(specks, document.body.firstChild);

    var drawer = document.createElement('div');
    drawer.className = 'drawer'; drawer.id = 'drawer'; drawer.hidden = true;
    drawer.innerHTML =
      '<div class="drawer__in">' +
      '<div class="drawer__view"><div><b>Choose your view</b><span>Pro is detailed. Explore explains the essentials.</span></div><div class="view-switch" role="group" aria-label="Choose site view"><button type="button" data-view-choice="pro">Pro</button><button type="button" data-view-choice="explore">Explore</button></div></div>' +
      '<nav class="drawer__nav" aria-label="Ponds">' + order.map(function (k) {
        var p = PAGES[k];
        return '<a href="' + p.href + '" style="--c:' + p.color + '"' + (k === page ? ' aria-current="page"' : '') + '><span class="drawer__m">' + F.creature(k) + '</span><b>' + p.label + '</b></a>';
      }).join('') + '</nav>' +
      '<form class="drawer__key" id="keyForm" autocomplete="off"><h2>Your own Finnhub key</h2>' +
      '<p>This site already has a key built in. If you have your own free one from finnhub.io you can use it here. It stays in this browser only.</p>' +
      '<div class="drawer__row"><input id="keyInput" name="key" type="text" inputmode="text" spellcheck="false" placeholder="Paste your key" aria-label="Finnhub API key"><button class="btn" type="submit">Save</button></div>' +
      '<p class="drawer__note" id="keyNote" role="status"></p>' +
      '<button class="drawer__remove" id="keyRemove" type="button" hidden>Go back to the built-in key</button></form>' +
      '</div>';
    document.body.appendChild(drawer);

    var foot = document.createElement('footer');
    foot.className = 'foot';
    foot.innerHTML =
      '<div class="wrap foot__grid">' +
      '<div class="foot__brand"><span class="brand__mark">' + WAVE + '</span><b>FRMM</b><p>' + F.copy('Independent market context with a deep-sea identity.', 'Markets made clearer, with a lot of fish.') + '</p></div>' +
      '<nav class="foot__nav" aria-label="Ponds">' + order.map(function (k) { return '<a href="' + PAGES[k].href + '">' + PAGES[k].label + '</a>'; }).join('') + '</nav>' +
      '<div class="foot__src"><h2>Where it all comes from</h2><p><b>Prices:</b> Finnhub for shares, ETFs and ADRs listed in the US (free plan, so UK, European and Asian markets are tracked through US-listed funds and companies). CoinGecko for crypto. The European Central Bank, via Frankfurter, for exchange rates.</p>' +
      '<p><b>Headlines:</b> BBC News, The Guardian, Sky News, Financial Times, The Economist, CNBC, Reuters (via Finnhub), the Bank of England, the Office for National Statistics and HM Treasury. Every link opens the original article.</p></div>' +
      '</div><p class="wrap foot__legal">FRMM is for information and fun only. It is not financial advice, and prices can be delayed or wrong. Do your own research.</p>';
    document.body.appendChild(foot);
  }
  buildChrome();

  /* ---------- Pro / Explore switch ---------- */
  function paintViewSwitches() {
    F.each(document.querySelectorAll('[data-view-choice]'), function (button) {
      var active = button.getAttribute('data-view-choice') === F.view;
      button.setAttribute('aria-pressed', String(active));
    });
  }
  document.addEventListener('click', function (e) {
    var button = e.target.closest('[data-view-choice]');
    if (!button) return;
    F.setView(button.getAttribute('data-view-choice'));
    paintViewSwitches();
  });
  F.on('view', paintViewSwitches);
  paintViewSwitches();

  /* ---------- drawer ---------- */
  var burger = $('burger'), drawer = $('drawer');
  function setDrawer(open) {
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('drawer-open', open);
  }
  burger.addEventListener('click', function () { setDrawer(drawer.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) setDrawer(false); });
  drawer.addEventListener('click', function (e) { if (e.target === drawer) setDrawer(false); });

  var keyNote = $('keyNote'), keyRemove = $('keyRemove'), keyInput = $('keyInput');
  function paintKeyNote() {
    if (F.stockMode === 'demo') keyNote.textContent = F.key ? 'Finnhub did not accept that key, so you are seeing demo prices.' : 'No key set, so you are seeing demo prices.';
    else if (F.keySource === 'browser') keyNote.textContent = 'Using the key saved in this browser (ends ' + F.key.slice(-4) + ').';
    else keyNote.textContent = 'Live prices are on, using the built-in key (ends ' + F.key.slice(-4) + ').';
    keyRemove.hidden = F.keySource !== 'browser';
  }
  $('keyForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = keyInput.value.trim();
    if (!/^[A-Za-z0-9_\-]{12,}$/.test(v)) { keyNote.textContent = 'That does not look like a Finnhub key. It is letters and numbers, at least 12 characters.'; return; }
    try { localStorage.setItem('frmm.finnhubKey', v); } catch (err) { keyNote.textContent = 'This browser is blocking storage, so the key cannot be saved.'; return; }
    location.reload();
  });
  keyRemove.addEventListener('click', function () { try { localStorage.removeItem('frmm.finnhubKey'); } catch (e) { /* noop */ } location.reload(); });
  F.on('mode', paintKeyNote);
  paintKeyNote();

  /* ---------- live bindings (price + change pill + day range) ---------- */
  var bindings = [];
  function flash(el, d) { el.classList.remove('flash-up', 'flash-down'); void el.offsetWidth; el.classList.add(d === 'up' ? 'flash-up' : 'flash-down'); }
  F.bind = function (root, get, opts) {
    opts = opts || {};
    var b = { root: root, price: root.querySelector('.price'), pct: root.querySelector('.pct'), dot: root.querySelector('.range i'), get: get, cur: opts.cur || '$', last: null, abs: !!opts.abs };
    bindings.push(b); paint(b); return b;
  };
  function paint(b) {
    var d = b.get();
    if (!d || d.price == null || d._bad >= 3) { b.root.classList.add('is-loading'); b.root.classList.toggle('is-gone', !!(d && d._bad >= 3)); return; }
    b.root.classList.remove('is-loading', 'is-gone');
    var cur = typeof b.cur === 'function' ? b.cur() : b.cur;
    var txt = F.fmtPrice(d.price, cur);
    if (b.price && b.price.textContent !== txt) {
      if (b.last != null && d.price !== b.last) flash(b.price, d.price > b.last ? 'up' : 'down');
      b.price.textContent = txt; b.last = d.price;
    }
    if (b.pct) { b.pct.textContent = F.fmtPct(d.pct, b.abs); b.pct.className = 'pct ' + F.dir(d.pct); }
    if (b.dot && d.hi > d.lo) b.dot.style.left = (Math.min(1, Math.max(0, (d.price - d.lo) / (d.hi - d.lo))) * 100).toFixed(1) + '%';
    if (b.root.classList.contains('coin')) { b.root.classList.toggle('is-up', d.pct > 0); b.root.classList.toggle('is-down', d.pct < 0); }
  }
  F.paintAll = function () { for (var i = 0; i < bindings.length; i++) paint(bindings[i]); };
  F.clearBindings = function () { bindings = []; };
  F.on('tick', F.paintAll);

  /* ---------- ticker strip ---------- */
  function buildStrip() {
    var track = $('stripTrack'), html = '';
    for (var pass = 0; pass < 2; pass++) {
      TICK.forEach(function (t) {
        html += '<span class="tk is-loading" data-k="' + t[0] + ':' + t[1] + '"><b>' + esc(t[2]) + '</b><span class="price">--</span><span class="pct flat">--</span></span>';
      });
    }
    track.innerHTML = html;
    F.each(track.children, function (elx) {
      var parts = elx.getAttribute('data-k').split(':'), kind = parts[0], key = parts[1];
      if (kind === 'q') F.bind(elx, function () { return F.quotes[key]; }, { cur: '$', abs: true });
      else if (kind === 'c') F.bind(elx, function () { return F.coinOf(key); }, { cur: F.curSym, abs: true });
      else F.bind(elx, function () { for (var i = 0; i < F.fx.pairs.length; i++) { if (F.fx.pairs[i].code === key) return { price: F.fx.pairs[i].rate, pct: F.fx.pairs[i].pct, hi: 0, lo: 0 }; } return null; }, { cur: '', abs: true });
    });
    var badge = $('stripBadge');
    var upd = function () {
      var l = F.stockLabel();
      badge.className = 'strip__badge ' + l.cls;
      badge.querySelector('span').textContent = l.text;
      badge.title = l.help || l.text;
      badge.setAttribute('aria-label', l.text + (l.help ? ': ' + l.help : ''));
    };
    F.on('mode', upd); F.on('tick', upd); upd();
  }
  buildStrip();
  F.on('coins', F.paintAll); F.on('fx', F.paintAll);

  /* ---------- glowing specks (soft pulsing lights, no bubbles) ---------- */
  var specks = $('specks'), speckH = 0, doc = document.documentElement;
  function buildSpecks() {
    specks.style.height = '0px';
    var h = Math.max(doc.scrollHeight, window.innerHeight);
    if (Math.abs(h - speckH) < 250 && specks.children.length) { specks.style.height = speckH + 'px'; return; }
    speckH = h; specks.style.height = h + 'px';
    var n = Math.min(360, Math.round((h / 1000) * (window.innerWidth < 720 ? 22 : 40)));
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span'), core = [0.9, 1.1, 1.4, 1.8, 2.2][Math.floor(Math.random() * 5)], d = F.rand(3.6, 8.2);
      s.className = 'speck';
      s.style.left = F.rand(0.5, 99.5).toFixed(2) + '%'; s.style.top = Math.round(F.rand(6, h - 6)) + 'px';
      s.style.setProperty('--r', (core * F.rand(6, 9)).toFixed(1) + 'px'); s.style.setProperty('--d', d.toFixed(1) + 's'); s.style.setProperty('--dl', '-' + F.rand(0, d).toFixed(1) + 's');
      s.style.setProperty('--lo', F.rand(0.1, 0.24).toFixed(2)); s.style.setProperty('--hi', F.rand(0.45, 0.8).toFixed(2));
      frag.appendChild(s);
    }
    specks.textContent = ''; specks.appendChild(frag);
  }
  window.addEventListener('load', buildSpecks);
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildSpecks, 400); });
  setTimeout(buildSpecks, 2500); setTimeout(buildSpecks, 8000);

  /* ---------- header shadow + soft reveals ---------- */
  var topEl = $('top');
  function onScroll() { topEl.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -3% 0px' });
  }
  F.reveal = function (root) {
    F.each((root || document).querySelectorAll('.reveal:not(.is-in)'), function (elx) {
      if (io) io.observe(elx); else elx.classList.add('is-in');
    });
  };
  F.reveal();
})();
