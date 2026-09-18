/* FRMM trends: turns the last day's headlines from reputable outlets into a web of what is being talked about.
   1. Each headline (and a short snippet of its description) is matched against a topic list.
   2. Capitalised names that several different outlets use are picked up as extra topics.
   3. Topics that share a headline are joined, so the web shows what travels together. */
(function () {
  'use strict';

  var F = window.FRMM;
  var NS = 'http://www.w3.org/2000/svg';

  var CATS = F.CATS = {
    economy: { label: 'Economy', color: '#ffc857' },
    markets: { label: 'Markets', color: '#5aa8ff' },
    business: { label: 'Business', color: '#ff8595' },
    tech: { label: 'Tech', color: '#b98cff' },
    world: { label: 'World & politics', color: '#ffa25e' },
    energy: { label: 'Energy & climate', color: '#3ee6b8' },
    crypto: { label: 'Crypto', color: '#c8f542' },
    other: { label: 'Also in the news', color: '#a9bde6' }
  };

  /* id, label, category, pattern */
  var T = [
    ['inflation', 'Inflation', 'economy', /inflation|\bCPI\b|consumer price|cost of living|price rises|shrinkflation/i],
    ['rates', 'Interest rates', 'economy', /interest rates?|rate cuts?|rate hikes?|base rate|borrowing costs?|mortgage rates?|rate decision|monetary policy/i],
    ['boe', 'Bank of England', 'economy', /Bank of England|\bBoE\b|Andrew Bailey|\bMPC\b/],
    ['fed', 'US Federal Reserve', 'economy', /Federal Reserve|\bFed\b|Powell|FOMC/],
    ['ecb', 'European Central Bank', 'economy', /\bECB\b|European Central Bank|Lagarde/],
    ['growth', 'Growth & recession', 'economy', /\bGDP\b|recession|economic growth|economy (shrank|grew|slows|slowdown|contract)|stagflation|downturn/i],
    ['jobs', 'Jobs & wages', 'economy', /unemployment|jobless|job cuts|redundanc|labour market|payrolls|\bwages?\b|pay (rise|growth|deal)|minimum wage|hiring|layoffs?/i],
    ['budget', 'Budget & tax', 'economy', /\bBudget\b|tax (rise|rises|cut|cuts|hike|hikes|bill|raid)|\bHMRC\b|spending review|Rachel Reeves|fiscal|national insurance|stamp duty|\bISAs?\b/i],
    ['housing', 'Housing & mortgages', 'economy', /house prices?|home prices?|housing market|mortgages?|property market|estate agents?|landlords?|Nationwide|Halifax|first-time buyers?/i],
    ['bills', 'Energy bills', 'energy', /energy bills?|price cap|Ofgem|electricity prices?|gas prices?/i],
    ['stocks', 'Stocks & shares', 'markets', /\bstocks?\b|\bshares\b|equit(y|ies)|Wall Street|sell-?off|stock market|bull market|bear market/i],
    ['ftse', 'FTSE & London', 'markets', /FTSE|London Stock Exchange|London-listed|London market|blue-chip/i],
    ['us-indices', 'S&P 500 & Nasdaq', 'markets', /S&P 500|Nasdaq|Dow Jones|\bDow\b|Russell 2000/],
    ['bonds', 'Bonds & gilts', 'markets', /\bgilts?\b|bond yields?|bond market|Treasury yields?|Treasuries|10-year|30-year/i],
    ['oil', 'Oil', 'energy', /\boil\b|crude|Brent|OPEC|petrol|diesel|refiner/i],
    ['gold', 'Gold & metals', 'markets', /\bgold\b|silver|copper|bullion|precious metals?/i],
    ['fx', 'Sterling & currencies', 'markets', /sterling|the pound|\bGBP\b|currenc(y|ies)|forex|dollar index|the dollar|\byen\b|the euro\b/i],
    ['earnings', 'Earnings & dividends', 'markets', /earnings|\bprofits?\b|trading update|dividends?|quarterly|full-year|half-year|guidance/i],
    ['deals', 'Deals & takeovers', 'business', /takeover|acqui(re|res|red|sition)|merger|buyout|bid for|deal to buy|private equity|\bIPO\b|stock market listing|floats?\b/i],
    ['banks', 'Banks', 'business', /\bbanks\b|banking|HSBC|Barclays|Lloyds|NatWest|Santander|JPMorgan|Goldman|Morgan Stanley|lenders?\b/i],
    ['retail', 'Retail & shoppers', 'business', /retail|high street|supermarkets?|Tesco|Sainsbury|Asda|Morrisons|Marks (&|and) Spencer|\bM&S\b|Primark|consumer (spending|confidence)|shoppers?/i],
    ['travel', 'Travel & airlines', 'business', /airlines?|flights?|airports?|easyJet|Ryanair|Heathrow|Gatwick|British Airways|tourism/i],
    ['cars', 'Cars & EVs', 'business', /carmakers?|car makers?|automak|electric (vehicles?|cars?)|\bEVs?\b|Tesla|Jaguar Land Rover|\bJLR\b|Nissan|BYD/i],
    ['health', 'Health & pharma', 'business', /pharma|drugmakers?|\bNHS\b|Novo Nordisk|AstraZeneca|Pfizer|weight[- ]loss|GLP-1|Ozempic|Wegovy|biotech/i],
    ['ai', 'AI & chips', 'tech', /\bAI\b|artificial intelligence|OpenAI|ChatGPT|Anthropic|Nvidia|semiconductors?|\bchips?\b|data cent(re|er)s?/i],
    ['bigtech', 'Big Tech', 'tech', /Apple|Microsoft|Alphabet|Google|Amazon|\bMeta\b|Big Tech|Samsung|Netflix/],
    ['trump', 'Donald Trump', 'world', /Trump/],
    ['tariffs', 'Tariffs & trade', 'world', /tariffs?|trade war|trade deal|trade tensions|export controls|import dut/i],
    ['china', 'China', 'world', /China|Chinese|Beijing|Xi Jinping|\byuan\b/],
    ['mideast', 'Iran & the Middle East', 'world', /\bIran|Israel|Gaza|Middle East|Hormuz|Houthi|Tehran/],
    ['ukraine', 'Ukraine & Russia', 'world', /Ukrain|Russia|Putin|Kyiv|Moscow/],
    ['eu', 'Europe & the EU', 'world', /\bEU\b|European Union|Brussels|eurozone|euro area/],
    ['ukpol', 'UK politics', 'world', /Starmer|\bLabour\b|Tories|Conservatives?\b|Reform UK|Westminster|Downing Street|\bMPs?\b|Farage|Badenoch/],
    ['uspol', 'US politics', 'world', /White House|Congress|Senate|Republicans?\b|Democrats?\b/],
    ['climate', 'Energy & climate', 'energy', /renewables?|wind (farm|power)|\bsolar\b|nuclear|North Sea|net zero|climate|carbon|hydrogen|windfall/i],
    ['bitcoin', 'Bitcoin', 'crypto', /bitcoin|\bBTC\b/i],
    ['alts', 'Ethereum & altcoins', 'crypto', /ethereum|\bETH\b|solana|\bXRP\b|altcoins?|dogecoin/i],
    ['cryptorules', 'Crypto rules & ETFs', 'crypto', /stablecoins?|crypto (regulation|rules|bill|market)|\bSEC\b|spot ETF|Coinbase|Binance/i]
  ].map(function (r) { return { id: r[0], label: r[1], cat: r[2], re: r[3] }; });

  /* words that are capitalised but are not names */
  var STOP = /^(the|a|an|how|why|what|when|who|where|which|this|that|these|those|new|says|set|after|before|as|in|on|at|to|for|with|from|by|and|but|or|is|are|will|could|would|should|can|may|just|your|our|its|their|more|most|best|top|first|last|big|one|two|three|four|five|six|ten|us|uk|eu|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december|live|watch|opinion|analysis|editorial|exclusive|breaking|explained|comment|letters|review|podcast|video|photos|quiz|bank|government|minister|prime|chancellor|chief|company|companies|market|markets|shares|stock|stocks|oil|gold|bitcoin|labour|trump|britain|british|england|london|british|europe|european|american|america|united|states|kingdom|world|global|national|public|private|local|major|senior|former|leading|latest|business|economy|economic|finance|financial|money|price|prices|bill|bills|plan|plans|deal|deals|tax|taxes|year|years|week|weeks|day|days|time|people|workers|customers|investors|traders|analysts|experts|mps|ceo|cfo|ftse|gdp|cpi|nhs|ai|ipo|etf|sec|fed|ecb|boe|nyse|lse|plc|inc|ltd|corp|co|group|holdings|not|no|yes|now|here|there|all|any|some|many|much|few|if|so|it|he|she|we|they|you|i|do|does|did|has|have|had|be|been|being|was|were|up|down|out|over|under|into|off|why|less|amid|about|against|between|during|since|while|despite|following|ahead|behind|beyond|near|per|via)$/i;

  var DAY = 36 * 3600 * 1000;

  function tokens(title) {
    var out = [], parts = title.replace(/[“”"‘’]/g, ' ').split(/\s+/), i, cur = [];
    var flush = function () { if (cur.length) { out.push(cur.slice()); cur = []; } };
    for (i = 0; i < parts.length; i++) {
      var w = parts[i].replace(/[,:;!?()\[\]]+$/g, '').replace(/^[(\[]+/, '').replace(/['’]s$/, '');
      var lead = /^[A-Z][\w&'.-]*$/.test(w) && !/^[A-Z]{2,4}$/.test(w);
      var mid = /^(of|de|&|and)$/i.test(w) && cur.length && i + 1 < parts.length && /^[A-Z]/.test(parts[i + 1]);
      if (lead && !(i === 0 && STOP.test(w))) { cur.push(w); }
      else if (mid && cur.length) { cur.push(w); }
      else flush();
      if (/[,:;!?]$/.test(parts[i])) flush();
    }
    flush();
    return out.map(function (p) { while (p.length && /^(of|de|&|and)$/i.test(p[p.length - 1])) p.pop(); return p; })
      .filter(function (p) { return p.length && p.length <= 3; });
  }

  /* ---------- build the topic data ---------- */
  F.buildTopics = function (items, opts) {
    opts = opts || {};
    var now = Date.now();
    items = items.filter(function (it) { return !it.ts || now - it.ts < DAY; });
    var map = {};
    var add = function (id, label, cat, it, ent) {
      var n = map[id] || (map[id] = { id: id, label: label, cat: cat, items: [], srcs: {}, ent: !!ent });
      if (n.items.indexOf(it) < 0) { n.items.push(it); n.srcs[it.src] = (n.srcs[it.src] || 0) + 1; }
    };
    items.forEach(function (it) {
      var text = it.title + '. ' + (it.desc || '').slice(0, 140);
      it._t = [];
      T.forEach(function (t) { if (t.re.test(text)) { add(t.id, t.label, t.cat, it); it._t.push(t.id); } });
      var seen = {};
      tokens(it.title).forEach(function (p) {
        var phrase = p.join(' ');
        if (p.length === 1 && (STOP.test(p[0]) || p[0].length < 4)) return;
        if (seen[phrase]) return; seen[phrase] = 1;
        if (T.some(function (t) { return t.re.test(phrase); })) return;
        add('e:' + phrase.toLowerCase(), phrase, 'other', it, true);
        it._t.push('e:' + phrase.toLowerCase());
      });
    });

    var nodes = Object.keys(map).map(function (k) {
      var n = map[k]; n.mentions = n.items.length; n.sources = Object.keys(n.srcs).length;
      n.latest = Math.max.apply(null, n.items.map(function (i) { return i.ts || 0; }));
      n.score = n.mentions + n.sources * 0.6;
      return n;
    }).filter(function (n) { return n.ent ? (n.mentions >= 3 && n.sources >= 2) : n.mentions >= 2; });
    nodes.sort(function (a, b) { return b.score - a.score; });
    nodes = nodes.slice(0, opts.max || 30);

    var idx = {}; nodes.forEach(function (n, i) { idx[n.id] = i; n.i = i; n.nb = {}; });
    var eMap = {};
    items.forEach(function (it) {
      var ids = (it._t || []).filter(function (id) { return idx[id] != null; });
      for (var a = 0; a < ids.length; a++) for (var b = a + 1; b < ids.length; b++) {
        var k = Math.min(idx[ids[a]], idx[ids[b]]) + '-' + Math.max(idx[ids[a]], idx[ids[b]]);
        eMap[k] = (eMap[k] || 0) + 1;
      }
    });
    var edges = Object.keys(eMap).map(function (k) { var p = k.split('-'); return { a: +p[0], b: +p[1], w: eMap[k] }; });
    edges.forEach(function (e) { nodes[e.a].nb[e.b] = e.w; nodes[e.b].nb[e.a] = e.w; });

    var srcCount = {};
    items.forEach(function (it) { var s = srcCount[it.src] || (srcCount[it.src] = { name: it.src, type: it.type, n: 0 }); s.n++; });
    return { nodes: nodes, edges: edges, items: items.length, sources: Object.keys(srcCount).map(function (k) { return srcCount[k]; }).sort(function (a, b) { return b.n - a.n; }) };
  };

  /* ---------- force layout ---------- */
  function radius(n, minR, maxR, maxM) {
    return minR + (maxR - minR) * Math.sqrt(Math.min(1, n.mentions / maxM));
  }
  function layout(nodes, edges, W, H, compact) {
    var maxR = compact ? (W < 640 ? 42 : 54) : Math.min(88, Math.max(50, W * 0.085)), minR = compact ? 21 : W < 640 ? 25 : 30;
    var maxM = Math.max(3, nodes.reduce(function (m, n) { return Math.max(m, n.mentions); }, 0));
    nodes.forEach(function (n, i) {
      n.r = radius(n, minR, maxR, maxM);
      var a = i * 2.399963, rr = Math.sqrt(i + 0.6) * Math.min(W, H) * 0.085;
      n.x = W / 2 + Math.cos(a) * rr * 1.25; n.y = H / 2 + Math.sin(a) * rr; n.vx = 0; n.vy = 0;
    });
    var N = nodes.length, iters = 460, i, j, k, it;
    for (it = 0; it < iters; it++) {
      var alpha = 1 - it / iters;
      for (i = 0; i < N; i++) {
        var a = nodes[i];
        a.vx += (W / 2 - a.x) * 0.0016; a.vy += (H / 2 - a.y) * 0.0034;
        for (j = i + 1; j < N; j++) {
          var b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var minD = a.r + b.r + (compact ? 6 : 12);
          var f = 0;
          if (d < minD) f = (minD - d) * 0.5; else f = -Math.min(2.2, 2200 / (d * d)) * 0.1;
          var fx = dx / d * f, fy = dy / d * f;
          a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
        }
      }
      for (k = 0; k < edges.length; k++) {
        var e = edges[k], p = nodes[e.a], q = nodes[e.b];
        var ex = q.x - p.x, ey = q.y - p.y, ed = Math.sqrt(ex * ex + ey * ey) || 0.01;
        var rest = p.r + q.r + (compact ? 22 : 34) + 34 / Math.sqrt(e.w);
        var sf = (ed - rest) * 0.012 * Math.min(1.6, 0.5 + e.w * 0.3);
        p.vx += ex / ed * sf; p.vy += ey / ed * sf; q.vx -= ex / ed * sf; q.vy -= ey / ed * sf;
      }
      for (i = 0; i < N; i++) {
        var n = nodes[i];
        n.vx *= 0.78; n.vy *= 0.78;
        n.x += n.vx * (0.4 + alpha * 0.6); n.y += n.vy * (0.4 + alpha * 0.6);
        n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x));
        n.y = Math.max(n.r + 4, Math.min(H - n.r - 16, n.y));
      }
    }
    for (it = 0; it < 24; it++) {
      for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
        var u = nodes[i], v = nodes[j], ddx = v.x - u.x, ddy = v.y - u.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01, need = u.r + v.r + 4;
        if (dd < need) { var push = (need - dd) / 2; u.x -= ddx / dd * push; u.y -= ddy / dd * push; v.x += ddx / dd * push; v.y += ddy / dd * push; }
      }
      for (i = 0; i < N; i++) { var m = nodes[i]; m.x = Math.max(m.r + 4, Math.min(W - m.r - 4, m.x)); m.y = Math.max(m.r + 4, Math.min(H - m.r - 16, m.y)); }
    }
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function wrap(label, maxChars) {
    var words = label.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }

  /* ---------- the web (SVG) ---------- */
  F.renderWeb = function (host, data, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var W = Math.max(280, host.clientWidth || 900);
    var narrow = W < 640;
    var H = opts.height || (compact ? (narrow ? Math.round(W * 1.05) : Math.round(Math.min(420, W * 0.5))) : narrow ? 620 : Math.round(Math.min(700, Math.max(520, W * 0.58))));
    var show = data.nodes.slice(0, opts.maxNodes || (narrow ? 20 : 30));
    if (opts.cats) show = show.filter(function (n) { return opts.cats[n.cat] !== false; });
    var shown = {}; show.forEach(function (n, i) { shown[n.i] = i; });
    var edges = data.edges.filter(function (e) { return shown[e.a] != null && shown[e.b] != null; }).map(function (e) { return { a: shown[e.a], b: shown[e.b], w: e.w }; });
    var nodes = show.map(function (n) { var c = Object.create(n); return c; });
    layout(nodes, edges, W, H, compact);

    host.textContent = '';
    if (!nodes.length) { host.innerHTML = '<p class="empty">Nothing is trending in that mix yet. Try another category.</p>'; return null; }
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'web', role: 'group', 'aria-label': 'Web of trending topics' }, host);
    var defs = el('defs', {}, svg);
    var flt = el('filter', { id: 'wob' + (opts.uid || ''), x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.035', numOctaves: '2', seed: '4', result: 'n' }, flt);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: compact ? '3' : '5' }, flt);
    var gE = el('g', { class: 'web__edges' }, svg), gN = el('g', { class: 'web__nodes' }, svg);

    var edgeEls = edges.map(function (e) {
      var p = nodes[e.a], q = nodes[e.b], mx = (p.x + q.x) / 2 + (q.y - p.y) * 0.08, my = (p.y + q.y) / 2 - (q.x - p.x) * 0.08;
      var path = el('path', { d: 'M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + q.x.toFixed(1) + ' ' + q.y.toFixed(1), class: 'te', 'stroke-width': (1 + Math.min(3, e.w * 0.6)).toFixed(1) }, gE);
      path.style.opacity = Math.min(0.36, 0.1 + e.w * 0.05).toFixed(2);
      return path;
    });

    var nodeEls = nodes.map(function (n, idx) {
      var col = CATS[n.cat].color;
      var g = el('g', { class: 'tn', tabindex: '0', role: 'button', 'aria-label': n.label + ', ' + n.mentions + ' headlines from ' + n.sources + ' outlets' }, gN);
      var inner = el('g', { class: 'tn__in' }, g);
      inner.style.animationDelay = '-' + (idx * 0.73 % 6).toFixed(2) + 's';
      inner.style.animationDuration = (5 + (idx % 5)) + 's';
      el('circle', { cx: n.x.toFixed(1), cy: n.y.toFixed(1), r: (n.r + 4).toFixed(1), fill: 'none', stroke: col, 'stroke-opacity': '.35', 'stroke-dasharray': '2 6', class: 'tn__ring' }, inner);
      var blob = el('circle', { cx: n.x.toFixed(1), cy: n.y.toFixed(1), r: n.r.toFixed(1), fill: col, class: 'tn__blob', filter: 'url(#wob' + (opts.uid || '') + ')' }, inner);
      blob.setAttribute('stroke', '#fff7e6'); blob.setAttribute('stroke-width', compact ? '2.5' : '3.5');
      var fs = Math.max(10.5, Math.min(compact ? 12.5 : 18, n.r * 0.3));
      var inside = n.r >= (compact ? 24 : 29);
      var lines = wrap(n.label, inside ? Math.max(6, Math.floor(n.r * 1.7 / (fs * 0.56))) : 16);
      var t = el('text', { x: n.x.toFixed(1), y: (inside ? n.y - (lines.length - 1) * fs * 0.55 + fs * 0.3 : n.y + n.r + fs + 6).toFixed(1), 'text-anchor': 'middle', class: inside ? 'tn__t tn__t--in' : 'tn__t tn__t--out', 'font-size': fs.toFixed(1) }, inner);
      lines.forEach(function (ln, li) { var ts = el('tspan', { x: n.x.toFixed(1), dy: li === 0 ? '0' : (fs * 1.08).toFixed(1) }, t); ts.textContent = ln; });
      if (inside) {
        var c = el('text', { x: n.x.toFixed(1), y: (n.y + n.r - 8).toFixed(1), 'text-anchor': 'middle', class: 'tn__c', 'font-size': '10' }, inner);
        c.textContent = n.mentions + (n.mentions === 1 ? ' story' : ' stories');
      } else {
        var ct = el('text', { x: n.x.toFixed(1), y: (n.y + 4).toFixed(1), 'text-anchor': 'middle', class: 'tn__c tn__c--dark', 'font-size': '11' }, inner);
        ct.textContent = n.mentions;
      }
      g.addEventListener('mouseenter', function () { focus(idx); });
      g.addEventListener('focus', function () { focus(idx); });
      g.addEventListener('mouseleave', function () { focus(-1); });
      g.addEventListener('blur', function () { focus(-1); });
      g.addEventListener('click', function () { if (opts.onSelect) opts.onSelect(show[idx]); select(idx); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (opts.onSelect) opts.onSelect(show[idx]); select(idx); } });
      return g;
    });

    function focus(idx) {
      svg.classList.toggle('has-focus', idx >= 0);
      nodeEls.forEach(function (g, i) {
        var on = idx >= 0 && (i === idx || nodes[idx].nb[show[i].i] != null);
        g.classList.toggle('is-on', on);
      });
      edgeEls.forEach(function (p, k) { p.classList.toggle('is-on', idx >= 0 && (edges[k].a === idx || edges[k].b === idx)); });
    }
    function select(idx) { nodeEls.forEach(function (g, i) { g.classList.toggle('is-sel', i === idx); }); }
    return { select: function (id) { var ix = show.findIndex(function (n) { return n.id === id; }); select(ix); }, nodes: show };
  };

  /* ---------- the grid ---------- */
  F.renderGrid = function (host, data, opts) {
    opts = opts || {};
    var list = data.nodes.filter(function (n) { return !opts.cats || opts.cats[n.cat] !== false; }).slice(0, opts.max || 24);
    var top = list.length ? list[0].score : 1;
    host.innerHTML = list.map(function (n, i) {
      var col = CATS[n.cat].color;
      var srcs = Object.keys(n.srcs).slice(0, 4).map(function (s) { return '<span class="pill">' + F.esc(s) + '</span>'; }).join('');
      var hl = n.items.slice(0, 2).map(function (it) { return '<li>' + F.esc(it.title) + '</li>'; }).join('');
      return '<button class="hot" type="button" data-id="' + F.esc(n.id) + '" style="--c:' + col + ';--tilt:' + (((i * 37) % 7) - 3) * 0.25 + 'deg">' +
        '<span class="hot__rank">' + (i + 1) + '</span>' +
        '<span class="hot__cat">' + F.esc(CATS[n.cat].label) + '</span>' +
        '<b class="hot__name">' + F.esc(n.label) + '</b>' +
        '<span class="hot__bar"><i style="width:' + Math.max(8, Math.round(n.score / top * 100)) + '%"></i></span>' +
        '<span class="hot__meta">' + n.mentions + ' stories · ' + n.sources + ' outlet' + (n.sources === 1 ? '' : 's') + '</span>' +
        '<span class="hot__src">' + srcs + '</span>' +
        '<ul class="hot__hl">' + hl + '</ul></button>';
    }).join('') || '<p class="empty">Nothing is trending in that mix yet.</p>';
    F.each(host.querySelectorAll('.hot'), function (b) {
      b.addEventListener('click', function () {
        var n = data.nodes.find(function (x) { return x.id === b.getAttribute('data-id'); });
        if (n && opts.onSelect) opts.onSelect(n);
      });
    });
  };

  /* ---------- detail for one topic ---------- */
  F.topicDetail = function (n, data, onPick) {
    var col = CATS[n.cat].color;
    var rel = Object.keys(n.nb).map(function (k) { return { n: data.nodes[+k], w: n.nb[k] }; }).filter(function (r) { return r.n; }).sort(function (a, b) { return b.w - a.w; }).slice(0, 6);
    var items = n.items.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 8);
    var html = '<div class="detail__top"><span class="dot" style="background:' + col + '"></span><span class="detail__cat">' + F.esc(CATS[n.cat].label) + '</span></div>' +
      '<h3 class="detail__title">' + F.esc(n.label) + '</h3>' +
      '<p class="detail__meta">' + n.mentions + ' stories from ' + n.sources + ' outlet' + (n.sources === 1 ? '' : 's') + ' in the last day and a half</p>';
    if (rel.length) html += '<p class="detail__k">Swims with</p><div class="chips">' + rel.map(function (r) { return '<button type="button" class="chip" data-id="' + F.esc(r.n.id) + '" style="--c:' + CATS[r.n.cat].color + '">' + F.esc(r.n.label) + '</button>'; }).join('') + '</div>';
    html += '<p class="detail__k">Straight from the source</p><ul class="detail__list">' + items.map(function (it) {
      return '<li><a href="' + F.esc(it.url) + '" target="_blank" rel="noopener noreferrer"><span class="detail__hl">' + F.esc(it.title) + '</span>' +
        '<span class="detail__src">' + F.esc(it.src) + (it.type === 'official' ? ' · Official' : '') + (it.ts ? ' · ' + F.timeAgo(it.ts) : '') + '</span></a></li>';
    }).join('') + '</ul>';
    return html;
  };

  F.topicsFromFeed = function (opts) { return F.buildTopics(F.feed.items, opts); };
})();
