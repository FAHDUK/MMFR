/* FRMM pages: builds each pond (UK, US, Europe, Asia, Crypto), the Trends page and the home page */
(function () {
  'use strict';

  var F = window.FRMM, $ = F.$, esc = F.esc, each = F.each;
  var page = F.page;
  var main = $('main');

  /* ---------- page settings ---------- */
  var P = {
    uk: {
      num: '01', name: 'United Kingdom', title: 'The UK', seal: 'LIVE FROM LONDON',
      lede: 'Sterling, the big London names and the news that moves them. UK shares are followed through the MSCI UK fund and London giants listed in New York, so prices are in dollars.',
      simple: 'See how major UK companies, the pound and today\'s biggest stories are moving.',
      guide: '<b>Quick guide</b><span><strong>ETF</strong> means a basket of investments. <strong>ADR</strong> lets a UK company trade in New York. Some UK prices here are therefore shown in US dollars.</span>',
      tiles: ['EWU', 'SHEL', 'AZN', 'HSBC'], list: ['BP', 'UL', 'GSK', 'DEO', 'RIO', 'BTI', 'BCS', 'LYG', 'VOD', 'NGG', 'NWG', 'RELX'],
      hours: ['LSE', 'NYSE'], fx: ['USD', 'EUR', 'JPY', 'CHF'], official: true,
      feeds: ['bbc-biz', 'bbc-eco', 'gdn-biz', 'sky', 'ft-uk', 'boe', 'ons', 'hmt'],
      news: { tags: ['uk'], re: /\bUK\b|Britain|British|London|Bank of England|FTSE|sterling|Starmer|Reeves|Treasury|\bNHS\b/ },
      listTitle: 'The London crowd', listSub: 'UK giants, priced in US dollars in New York',
      note: 'Direct London Stock Exchange prices are a paid data feed. Until then, the UK is followed through the iShares MSCI UK fund and UK companies listed in New York (ADRs).',
      quips: ['Cuppa first, then the markets.', 'Mind the gap between headlines and prices.', 'Tea, biscuits and basis points.']
    },
    us: {
      num: '02', name: 'United States', title: 'The US', seal: 'STRAIGHT FROM NEW YORK',
      lede: 'Wall Street in one glance: the big indices, the household names, and the gold, oil, dollar and bond moves underneath them.',
      simple: 'Follow the best-known US market groups, companies and today\'s biggest movers.',
      guide: '<b>Quick guide</b><span>An <strong>index</strong> follows a group of investments. The S&amp;P 500 follows 500 large US companies; Nasdaq is weighted towards technology.</span>',
      tiles: ['SPY', 'QQQ', 'DIA', 'IWM'], list: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'JPM', 'V'],
      extra: { title: 'Other tides', sub: 'Gold, oil, the dollar and bonds', list: ['GLD', 'USO', 'UUP', 'TLT'] },
      hours: ['NYSE', 'LSE'], fx: ['USD', 'CAD'], feeds: ['cnbc', 'cnbc-eco', 'ft-mkts'],
      news: { tags: ['us'], re: /Wall Street|\bU\.?S\.?\b|Fed\b|Trump|Nasdaq|S&P|\bDow\b|Treasury|American|Washington/ },
      listTitle: 'The big fish', listSub: 'Household names on Wall Street',
      note: 'Shares and funds trade 14:30 to 21:00 UK time. Outside those hours you see the last close.',
      quips: ['Big stocks, bigger opinions.', 'Yes, that is a lot of zeros.', 'Stars, stripes and stock tickers.']
    },
    europe: {
      num: '03', name: 'Europe', title: 'Europe', seal: 'FROM THE CONTINENT',
      lede: 'Our nearest neighbours: the euro area, Germany, France and friends, plus the continental companies everyone has heard of.',
      simple: 'See how major European markets and well-known companies are moving today.',
      guide: '<b>Quick guide</b><span>A country <strong>fund</strong> holds shares from that market. It gives a broad view rather than tracking one company.</span>',
      tiles: ['FEZ', 'VGK', 'EWG', 'EWQ'], list: ['EWI', 'EWP', 'EWL', 'EWN', 'ASML', 'SAP', 'NVO', 'TTE', 'SNY'],
      hours: ['XETRA', 'LSE', 'NYSE'], fx: ['EUR', 'CHF'], feeds: ['ft-mkts', 'gdn-eco', 'economist', 'bbc-biz'],
      news: { tags: [], re: /Europe|eurozone|\bEU\b|\bECB\b|Germany|German|France|French|Italy|Spain|Brussels|\bDAX\b|Lagarde|euro\b/ },
      listTitle: 'Around the continent', listSub: 'Countries and companies, priced in US dollars in New York',
      note: 'European markets are followed through US-listed funds and company listings (ADRs), so prices are in dollars and move with New York hours.',
      quips: ['Bonjour, hallo, ciao.', 'Twenty-odd currencies, one very busy octopus.', 'Do not mention the queue at passport control.']
    },
    asia: {
      num: '04', name: 'Asia-Pacific', title: 'Asia', seal: 'EAST OF THE SUN',
      lede: 'Tokyo, Hong Kong, Shanghai, Mumbai and beyond: the country funds, and the chipmakers and carmakers that sell to the world.',
      simple: 'Explore major Asian markets, technology companies and carmakers in one place.',
      guide: '<b>Quick guide</b><span>The region opens before Europe and America. Many prices here use US-listed funds, so they may move during New York trading hours.</span>',
      tiles: ['EWJ', 'FXI', 'EWH', 'INDA'], list: ['MCHI', 'EWY', 'EWT', 'EWS', 'EWA', 'TSM', 'BABA', 'SONY', 'TM', 'INFY', 'PDD'],
      hours: ['TSE', 'HKEX', 'NYSE'], fx: ['JPY', 'CNY', 'INR', 'AUD'], feeds: ['ft-mkts', 'economist', 'cnbc'],
      news: { tags: [], re: /Asia|China|Chinese|Japan|Japanese|Hong Kong|India|Nikkei|\byuan\b|\byen\b|Korea|Taiwan|TSMC|Singapore|Australia|Beijing|Tokyo/ },
      listTitle: 'Across the region', listSub: 'Country funds and company giants, priced in US dollars in New York',
      note: 'Asian markets are followed through US-listed funds and company listings, so prices are in dollars and move with New York hours.',
      quips: ['Follow the sun, follow the yen.', 'Chips with everything.', 'Konnichiwa, Hong Kong and hello, Mumbai.']
    }
  };

  /* ---------- small builders ---------- */
  function sparkPath(vals, w, h) {
    if (!vals || vals.length < 2) return '';
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), sp = (max - min) || 1;
    var pts = vals.map(function (v, i) { return [(i / (vals.length - 1)) * w, h - 3 - ((v - min) / sp) * (h - 6)]; });
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(2); }).join(' ');
  }
  function tileHTML(sym) {
    return '<div class="tile is-loading" data-sym="' + sym + '"><div class="tile__top"><b>' + esc(F.symName(sym)) + '</b><span class="chip">' + sym + '</span></div>' +
      '<div class="tile__price price">--</div><div class="tile__bottom"><span class="range" title="Where today\'s price sits between the day low and high"><i></i></span><span class="pct flat">--</span></div></div>';
  }
  function rowHTML(sym) {
    return '<div class="row is-loading" data-sym="' + sym + '"><div class="row__id"><b>' + sym + '</b><span>' + esc(F.symName(sym)) + '</span></div>' +
      '<span class="price">--</span><span class="pct flat">--</span><span class="range" title="Day range"><i></i></span></div>';
  }
  function headRow() { return '<div class="row row--head" aria-hidden="true"><span>Name</span><span>Price</span><span>Today</span><span>Day range</span></div>'; }
  function fillQuotes(id, syms, fn) {
    var host = $(id); if (!host) return;
    host.innerHTML = syms.map(fn).join('');
    each(host.querySelectorAll('[data-sym]'), function (elx) {
      var s = elx.getAttribute('data-sym'); F.bind(elx, function () { return F.quotes[s]; }, { cur: '$' });
    });
  }
  function cardHTML(it, i) {
    return '<a class="card" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer" style="--tilt:' + (((i * 5) % 3) - 1) * 0.35 + 'deg">' +
      '<span class="tag"><b>' + esc(it.src) + '</b>' + (it.type === 'official' ? '<em>Official</em>' : '') + '<span>' + esc(F.timeAgo(it.ts)) + '</span></span>' +
      '<span class="card__t">' + esc(it.title) + '</span>' +
      '<span class="go">Read at the source <svg width="28" height="10" viewBox="0 0 34 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M0 5h32M28 1l4 4-4 4"/></svg></span></a>';
  }
  function badgeHTML(kind) { return '<span class="badge" data-badge="' + kind + '"><i></i><span class="badge__state">--</span><small class="badge__help"></small></span>'; }
  function paintBadges() {
    each(document.querySelectorAll('[data-badge]'), function (b) {
      var l = b.getAttribute('data-badge') === 'crypto' ? F.cryptoLabel() : F.stockLabel();
      b.className = 'badge ' + l.cls;
      var state = b.querySelector('.badge__state') || b.querySelector('span');
      var help = b.querySelector('.badge__help');
      state.textContent = l.text;
      if (help) help.textContent = l.help || '';
      b.title = l.help || l.text;
    });
  }
  function hoursHTML(ids) {
    return ids.map(function (id) { return '<span class="hr" data-ex="' + id + '"><i></i>' + esc(F.EXCHANGES[id].name) + ' <b></b> <em></em></span>'; }).join('');
  }
  function paintHours() {
    each(document.querySelectorAll('[data-ex]'), function (s) {
      var id = s.getAttribute('data-ex'), open = F.isOpen(id);
      s.classList.toggle('is-open', open);
      s.querySelector('b').textContent = F.clock(F.EXCHANGES[id].tz);
      s.querySelector('em').textContent = open ? 'open' : 'closed';
    });
  }
  function seal(text, id) {
    var unit = text + ' \u00b7 ', n = Math.max(1, Math.round(34 / unit.length)), t = new Array(n + 1).join(unit);
    var fs = Math.min(13, 278 / t.length * 1.32).toFixed(1);
    return '<svg class="seal" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="sl' + id + '" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"/></defs><text style="font-size:' + fs + 'px"><textPath href="#sl' + id + '" textLength="276" lengthAdjust="spacing">' + esc(t) + '</textPath></text></svg>';
  }
  function moverList(id, arr, kind, cur, pad) {
    var host = $(id); if (!host) return;
    var rows = arr.map(function (q, i) {
      var sym = q.sym.toUpperCase();
      return '<li class="mv"><span class="mv__rank">' + (i + 1) + '</span><span class="mv__id"><b>' + esc(sym) + '</b><span>' + esc(q.name) + '</span></span><span class="price">' + esc(F.fmtPrice(q.price, cur)) + '</span><span class="pct ' + F.dir(q.pct) + '">' + F.fmtPct(q.pct) + '</span></li>';
    });
    while (rows.length < pad) rows.push('<li class="mv mv--empty"><span class="mv__rank">' + (rows.length + 1) + '</span><span class="mv__id"><span>' + (kind === 'up' ? 'No more risers right now' : 'No more fallers right now') + '</span></span></li>');
    host.innerHTML = rows.join('');
  }

  /* ---------- a market pond ---------- */
  function renderPond(cfg) {
    var all = cfg.tiles.concat(cfg.list, cfg.extra ? cfg.extra.list : []);
    var scope = cfg.tiles.concat(cfg.list);
    document.title = 'FRMM | ' + cfg.title + ' markets';
    main.innerHTML =
      '<section class="phero"><div class="wrap phero__grid">' +
      '<div class="phero__copy"><p class="sticker">' + F.copy('Market ' + cfg.num + ' · ' + cfg.name, 'Pond ' + cfg.num + ' · ' + cfg.name) + '</p>' +
      '<h1 class="phero__title">' + esc(cfg.title) + '<svg class="squig" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8c12-9 20 9 32 0s20 9 32 0 20 9 32 0 20 9 32 0 20 9 32 0 20 9 34 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></h1>' +
      '<p class="phero__lede">' + F.copy(cfg.lede, cfg.simple) + '</p>' +
      '<div class="hours" id="hours">' + hoursHTML(cfg.hours) + '</div>' +
      '<aside class="explorer-guide">' + cfg.guide + '</aside></div>' +
      '<div class="phero__art"><div class="phero__blob" aria-hidden="true"></div>' + seal(cfg.seal, page) +
      '<div class="mascot">' + F.creature(page) + '</div>' +
      '<div class="bubble" id="bubble" aria-live="polite"><b id="bubbleMood">' + F.copy('Market breadth', 'Checking the tide') + '</b><span id="bubbleLine">' + F.copy('Waiting for the latest price data.', cfg.quips[0]) + '</span></div></div>' +
      '</div></section>' +

      '<section class="sec" id="tiles"><div class="wrap">' +
      '<div class="sec__head reveal"><h2 class="h2">' + F.copy('Key market indicators', 'Headline acts') + '</h2>' + badgeHTML('stocks') + '</div>' +
      '<div class="tiles reveal" id="tileGrid"></div></div></section>' +

      '<section class="sec" id="movers"><div class="wrap">' +
      '<div class="sec__head reveal"><h2 class="h2">' + F.copy('Market movers', 'Big fish & small fry') + '</h2><p class="sub">' + F.copy('Largest percentage gains and losses in this market view', 'Today\'s biggest risers and fallers on this page') + '</p></div>' +
      '<div class="mvgrid reveal"><div class="panel mvcol mvcol--up"><h3><span class="arrow arrow--up"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12V3M3 6l4-4 4 4"/></svg></span>' + F.copy('Top gainers', 'Big fish') + '<small>' + F.copy('highest today', 'riding high') + '</small></h3><ol class="mvlist" id="mvUp"></ol></div>' +
      '<div class="panel mvcol mvcol--down"><h3><span class="arrow arrow--down"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v9M3 8l4 4 4-4"/></svg></span>' + F.copy('Top decliners', 'Small fry') + '<small>' + F.copy('lowest today', 'feeling the pressure') + '</small></h3><ol class="mvlist" id="mvDown"></ol></div></div></div></section>' +

      '<section class="sec" id="shoal"><div class="wrap">' +
      '<div class="sec__head reveal"><h2 class="h2">' + esc(cfg.listTitle) + '</h2><p class="sub">' + esc(cfg.listSub) + '</p></div>' +
      '<div class="panel tbl reveal" id="shoalTable"></div>' +
      (cfg.extra ? '<div class="sec__head sec__head--sub reveal"><h3 class="h3">' + esc(cfg.extra.title) + '</h3><p class="sub">' + esc(cfg.extra.sub) + '</p></div><div class="panel tbl reveal" id="extraTable"></div>' : '') +
      '<p class="foot-note reveal">' + esc(cfg.note) + '</p></div></section>' +

      '<section class="sec" id="sterling"><div class="wrap">' +
      '<div class="sec__head reveal"><h2 class="h2">' + F.copy('Sterling exchange rates', 'Pound converter') + '</h2><p class="sub">' + F.copy('European Central Bank reference rates for one pound sterling', 'What £1 buys today. Green means the pound became stronger.') + '</p></div>' +
      '<div class="fxgrid reveal" id="fxGrid"></div></div></section>' +

      (cfg.official ? '<section class="sec" id="official"><div class="wrap"><div class="sec__head reveal"><h2 class="h2">' + F.copy('Official releases', 'The official desk') + '</h2><p class="sub">Straight from the Bank of England, the Office for National Statistics and HM Treasury</p></div><div class="offgrid reveal" id="offGrid"></div></div></section>' : '') +

      '<section class="sec sec--last" id="news"><div class="wrap">' +
      '<div class="sec__head reveal"><h2 class="h2">' + F.copy('Market news', 'Fresh from the newsroom') + '</h2><a class="btn" href="trends.html">See what is trending</a></div>' +
      '<div class="cards reveal" id="cards"></div><p class="foot-note" id="newsFoot"></p></div></section>';

    fillQuotes('tileGrid', cfg.tiles, tileHTML);
    $('shoalTable').innerHTML = headRow() + '<div id="shoalRows"></div>';
    fillQuotes('shoalRows', cfg.list, rowHTML);
    if (cfg.extra) { $('extraTable').innerHTML = headRow() + '<div id="extraRows"></div>'; fillQuotes('extraRows', cfg.extra.list, rowHTML); }

    var lastMv = 0, quipI = 0, mvT = null;
    var paintMovers = function () {
      if (Date.now() - lastMv < 2500) { if (!mvT) mvT = setTimeout(function () { mvT = null; paintMovers(); }, 2600); return; }
      lastMv = Date.now();
      var m = F.movers(scope, 3);
      moverList('mvUp', m.winners, 'up', '$', 3); moverList('mvDown', m.losers, 'down', '$', 3);
      var mood = F.mood(scope);
      if (mood) {
        var up = scope.filter(function (s) { return F.quotes[s].price != null && F.quotes[s].pct > 0; }).length;
        $('bubbleMood').textContent = F.view === 'pro' ? 'Market breadth' : mood.label;
        var best = m.winners[0];
        $('bubbleLine').textContent = F.view === 'pro'
          ? up + ' of ' + scope.length + ' instruments are higher' + (best ? '. Leading: ' + best.sym + ' ' + F.fmtPct(best.pct) : '') + '.'
          : up + ' of ' + scope.length + ' up' + (best ? '. Biggest fish: ' + best.sym + ' ' + F.fmtPct(best.pct) : '') + '.';
      }
    };
    F.on('tick', paintMovers); F.on('view', paintMovers);
    setInterval(function () { quipI = (quipI + 1) % cfg.quips.length; }, 9000);

    var paintFx = function () {
      var host = $('fxGrid'); if (!host) return;
      var pairs = F.fx.pairs.filter(function (p) { return cfg.fx.indexOf(p.code) >= 0; });
      if (!pairs.length) { host.innerHTML = '<p class="empty">Exchange rates are loading.</p>'; return; }
      host.innerHTML = pairs.map(function (p) {
        return '<div class="fx"><span class="fx__code">&pound;1 &rarr; ' + p.code + '</span><b class="fx__rate">' + esc(p.rate.toLocaleString('en-GB', { maximumFractionDigits: p.rate > 50 ? 2 : 4, minimumFractionDigits: p.rate > 50 ? 2 : 4 })) + '</b><span class="fx__name">' + esc(p.name) + '</span><span class="pct ' + F.dir(p.pct) + '">' + F.fmtPct(p.pct) + '</span></div>';
      }).join('');
    };
    F.on('fx', paintFx); paintFx();

    var paintNews = function () {
      var host = $('cards'); if (!host) return;
      var list = F.headlines({ tags: cfg.news.tags, re: cfg.news.re, n: 6, official: cfg.official ? false : undefined });
      if (list.length < 6) list = list.concat(F.feed.items.filter(function (it) { return list.indexOf(it) < 0 && it.type !== 'official'; }).slice(0, 6 - list.length));
      host.innerHTML = list.map(cardHTML).join('') || '<p class="empty">' + (F.feed.status === 'error' ? 'The newsroom feeds are not answering right now. Try again in a minute.' : 'Fishing for headlines...') + '</p>';
      var used = {}; list.forEach(function (it) { used[it.src] = 1; });
      $('newsFoot').textContent = list.length ? 'Sources: ' + Object.keys(used).join(', ') + '. Links open the original publisher in a new tab.' : '';
      if (cfg.official) {
        var off = F.feed.items.filter(function (it) { return it.type === 'official'; });
        var groups = {}; off.forEach(function (it) { (groups[it.src] = groups[it.src] || []).push(it); });
        var og = $('offGrid');
        og.innerHTML = Object.keys(groups).map(function (k) {
          return '<div class="panel off"><h3>' + esc(k) + '</h3><ul>' + groups[k].slice(0, 4).map(function (it) { return '<li><a href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(it.title) + '</span><em>' + esc(F.timeAgo(it.ts)) + '</em></a></li>'; }).join('') + '</ul></div>';
        }).join('') || '<p class="empty">Official releases are loading.</p>';
      }
    };
    F.on('feeds', paintNews); paintNews();
    F.reveal();
    F.watch(all);
    F.startFeeds(cfg.feeds);
  }

  /* ---------- crypto ---------- */
  function renderCrypto() {
    document.title = 'FRMM | Crypto';
    main.innerHTML =
      '<section class="phero"><div class="wrap phero__grid">' +
      '<div class="phero__copy"><p class="sticker">' + F.copy('Market 05 · Digital assets', 'Pond 05 · Crypto') + '</p>' +
      '<h1 class="phero__title">Crypto<svg class="squig" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8c12-9 20 9 32 0s20 9 32 0 20 9 32 0 20 9 32 0 20 9 32 0 20 9 34 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></h1>' +
      '<p class="phero__lede">' + F.copy('A continuously traded digital-asset market. CoinGecko prices are shown in pounds by default and refresh about every 45 seconds.', 'Crypto never closes. See the biggest coins, what they cost and how they moved over 24 hours.') + '</p>' +
      '<div class="seg" id="curSeg" role="tablist" aria-label="Currency"><button type="button" role="tab" data-cur="gbp">&pound; Pounds</button><button type="button" role="tab" data-cur="usd">$ Dollars</button></div>' +
      '<aside class="explorer-guide"><b>Quick guide</b><span><strong>Market capitalisation</strong> means the price of one coin multiplied by all coins currently in circulation. It estimates the total value of a cryptocurrency.</span></aside></div>' +
      '<div class="phero__art"><div class="phero__blob" aria-hidden="true"></div>' + seal('ALWAYS OPEN', page) + '<div class="mascot">' + F.creature('crypto') + '</div>' +
      '<div class="bubble"><b id="bubbleMood">' + F.copy('24-hour market breadth', 'Reading the tea leaves') + '</b><span id="bubbleLine">' + F.copy('Waiting for the latest CoinGecko prices.', 'Prices can move fast. Hold on to your claws.') + '</span></div></div>' +
      '</div></section>' +

      '<section class="sec" id="coinsec"><div class="wrap"><div class="sec__head reveal"><h2 class="h2">' + F.copy('Leading digital assets', 'The big shellfish') + '</h2>' + badgeHTML('crypto') + '</div><div class="coins reveal" id="coins"></div></div></section>' +
      '<section class="sec" id="movers"><div class="wrap"><div class="sec__head reveal"><h2 class="h2">' + F.copy('24-hour movers', 'Big fish & small fry') + '</h2><p class="sub">Biggest 24-hour percentage changes among the leading coins</p></div>' +
      '<div class="mvgrid reveal"><div class="panel mvcol mvcol--up"><h3><span class="arrow arrow--up"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12V3M3 6l4-4 4 4"/></svg></span>' + F.copy('Top gainers', 'Big fish') + '<small>' + F.copy('highest today', 'riding high') + '</small></h3><ol class="mvlist" id="mvUp"></ol></div>' +
      '<div class="panel mvcol mvcol--down"><h3><span class="arrow arrow--down"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v9M3 8l4 4 4-4"/></svg></span>' + F.copy('Top decliners', 'Small fry') + '<small>' + F.copy('lowest today', 'feeling the pressure') + '</small></h3><ol class="mvlist" id="mvDown"></ol></div></div></div></section>' +
      '<section class="sec" id="allcoins"><div class="wrap"><div class="sec__head reveal"><h2 class="h2">' + F.copy('Extended market list', 'The rest of the reef') + '</h2><p class="sub">' + F.copy('Additional coins ranked by market capitalisation', 'More coins ranked by their total value') + '</p></div><div class="panel tbl tbl--coins reveal" id="coinTable"></div></div></section>' +
      '<section class="sec sec--last" id="news"><div class="wrap"><div class="sec__head reveal"><h2 class="h2">' + F.copy('Digital-asset news', 'Fresh from the newsroom') + '</h2><a class="btn" href="trends.html">See what is trending</a></div><div class="cards reveal" id="cards"></div><p class="foot-note" id="newsFoot"></p></div></section>';

    var seg = $('curSeg');
    var paintSeg = function () { each(seg.querySelectorAll('button'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-cur') === F.cur)); }); };
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { F.setCur(b.getAttribute('data-cur')); paintSeg(); } });
    paintSeg();

    var paintCoins = function () {
      var cur = F.curSym(), host = $('coins');
      if (!F.coins.length) {
        host.innerHTML = '<p class="empty">' + (F.coinsStatus === 'error' ? 'CoinGecko is busy right now. Retrying automatically.' : 'Diving for prices...') + '</p>';
        $('coinTable').innerHTML = ''; moverList('mvUp', [], 'up', cur, 3); moverList('mvDown', [], 'down', cur, 3); return;
      }
      host.innerHTML = F.coins.slice(0, 8).map(function (c) {
        var up = c.spark.length > 1 && c.spark[c.spark.length - 1] >= c.spark[0], col = up ? '#3ee6b8' : '#ff7d8c';
        var img = /^https:/.test(c.image || '') ? '<img class="coin__img" loading="lazy" alt="" src="' + esc(c.image) + '">' : '<span class="coin__img">' + esc(c.sym.slice(0, 3).toUpperCase()) + '</span>';
        return '<div class="coin" data-coin="' + esc(c.sym) + '"><div class="coin__top">' + img + '<div class="coin__id"><b>' + esc(c.sym.toUpperCase()) + '</b><span>' + esc(c.name) + '</span></div></div>' +
          '<div class="coin__price price">--</div><div class="coin__mid"><span class="pct flat">--</span><span class="coin__24">24 HOURS</span></div>' +
          '<svg class="coin__spark" viewBox="0 0 220 52" preserveAspectRatio="none" aria-hidden="true"><path d="' + sparkPath(c.spark, 220, 52) + ' L220 52 L0 52 Z" fill="' + col + '" opacity=".13"/><path d="' + sparkPath(c.spark, 220, 52) + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>' +
          '<div class="coin__foot"><span>Low ' + esc(F.fmtPrice(c.lo, cur)) + '</span><span>High ' + esc(F.fmtPrice(c.hi, cur)) + '</span></div></div>';
      }).join('');
      F.clearBindings();
      each(host.querySelectorAll('[data-coin]'), function (elx) { var s = elx.getAttribute('data-coin'); F.bind(elx, function () { return F.coinOf(s); }, { cur: F.curSym }); });
      $('coinTable').innerHTML = '<div class="row row--head" aria-hidden="true"><span>Name</span><span>Price</span><span>24 hours</span><span>' + F.copy('Market capitalisation', 'Total coin value') + '</span></div>' + F.coins.slice(8, 40).map(function (c) {
        return '<div class="row"><div class="row__id"><b>' + esc(c.sym.toUpperCase()) + '</b><span>' + esc(c.name) + '</span></div><span class="price">' + esc(F.fmtPrice(c.price, cur)) + '</span><span class="pct ' + F.dir(c.pct) + '">' + F.fmtPct(c.pct) + '</span><span class="cap">' + esc(F.fmtCompact(c.cap, cur)) + '</span></div>';
      }).join('');
      var m = F.coinMovers(3);
      moverList('mvUp', m.winners, 'up', cur, 3); moverList('mvDown', m.losers, 'down', cur, 3);
      var avg = F.coins.slice(0, 20).reduce(function (a, c) { return a + c.pct; }, 0) / Math.min(20, F.coins.length);
      $('bubbleMood').textContent = F.view === 'pro' ? '24-hour market breadth' : (avg > 3 ? 'To the moon (maybe)' : avg > 0.3 ? 'Bubbling nicely' : avg > -0.3 ? 'Crab-walking sideways' : avg > -3 ? 'A bit shellshocked' : 'Deep dive');
      $('bubbleLine').textContent = F.view === 'pro'
        ? 'The leading 20 assets are ' + (avg >= 0 ? 'higher by ' : 'lower by ') + Math.abs(avg).toFixed(1) + '% on average over 24 hours.'
        : 'The top 20 are ' + (avg >= 0 ? 'up ' : 'down ') + Math.abs(avg).toFixed(1) + '% on average today.';
      paintBadges();
    };
    F.on('coins', paintCoins); F.on('view', paintCoins); paintCoins();
    F.on('mode', paintBadges);

    var paintNews = function () {
      var list = F.feed.items.filter(function (it) { return it.tags.indexOf('crypto') >= 0; }).slice(0, 6);
      $('cards').innerHTML = list.map(cardHTML).join('') || '<p class="empty">' + (F.feed.status === 'error' ? 'The newsroom feeds are not answering right now.' : 'Fishing for headlines...') + '</p>';
      var used = {}; list.forEach(function (it) { used[it.src] = 1; });
      $('newsFoot').textContent = list.length ? 'Sources: ' + Object.keys(used).join(', ') + '. Links open the original publisher in a new tab.' : '';
    };
    F.on('feeds', paintNews); paintNews();
    F.reveal();
    F.startFeeds(['cointelegraph', 'coindesk']);
  }

  /* ---------- trends ---------- */
  function renderTrends() {
    document.title = 'FRMM | What is trending';
    main.innerHTML =
      '<section class="phero"><div class="wrap phero__grid">' +
      '<div class="phero__copy"><p class="sticker">' + F.copy('Intelligence 06 · News trends', 'Pond 06 · Trends') + '</p>' +
      '<h1 class="phero__title">' + F.copy('News coverage monitor', 'What everyone is saying') + '<svg class="squig" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8c12-9 20 9 32 0s20 9 32 0 20 9 32 0 20 9 32 0 20 9 32 0 20 9 34 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></h1>' +
      '<p class="phero__lede">' + F.copy('A ranked view of financial, economic and global topics appearing across monitored publishers during the last 36 hours. Frequency measures coverage, not importance or truth.', 'See which subjects appear most often in trusted news sources. A longer bar means more stories mentioned that topic.') + '</p>' +
      '<p class="trendstat" id="trendStat">Fishing for headlines...</p>' +
      '<aside class="explorer-guide"><b>Quick guide</b><span>This page counts repeated subjects in headlines. A topic can be widely discussed without being the most important—or necessarily correct.</span></aside></div>' +
      '<div class="phero__art"><div class="phero__blob" aria-hidden="true"></div>' + seal('WHAT EVERYONE IS SAYING', page) + '<div class="mascot">' + F.creature('trends') + '</div>' +
      '<div class="bubble"><b id="bubbleMood">' + F.copy('Leading topic', 'Something is glowing') + '</b><span id="bubbleLine">Tap a trend card to read the stories.</span></div></div></div></section>' +

      '<section class="sec" id="trends"><div class="wrap">' +
      '<div class="tools reveal"><div class="legend" id="legend" role="group" aria-label="Filter by category"></div></div>' +
      '<div class="trendgridwrap reveal"><div class="gridbox" id="gridBox"></div><aside class="detail panel" id="detail" aria-live="polite"><p class="detail__hint">Tap a trend card to see the stories behind it, each linking to the outlet that ran it.</p></aside></div></div></section>' +

      '<section class="sec sec--last" id="sources"><div class="wrap"><div class="sec__head reveal"><h2 class="h2">' + F.copy('Source coverage', 'Who is talking') + '</h2><p class="sub">Outlets behind the current picture</p></div><div class="srcs reveal" id="srcList"></div>' +
      '<p class="foot-note reveal">Topics are found by matching headlines against a list of subjects, plus names that several outlets use. It shows what is being covered, not whether it is true or important. Headlines are from BBC News, The Guardian, Sky News, the Financial Times, The Economist, CNBC, Reuters (via Finnhub), the Bank of England, the ONS and HM Treasury.</p></div></section>';

    var data = null, cats = {}, sel = null;
    var detail = $('detail'), gridBox = $('gridBox');
    Object.keys(F.CATS).forEach(function (k) { cats[k] = true; });

    var legend = $('legend');
    legend.innerHTML = Object.keys(F.CATS).map(function (k) { return '<button type="button" class="lg is-on" data-cat="' + k + '" style="--c:' + F.CATS[k].color + '" aria-pressed="true"><i></i>' + esc(F.CATS[k].label) + '</button>'; }).join('');
    legend.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var k = b.getAttribute('data-cat'); cats[k] = !cats[k];
      b.classList.toggle('is-on', cats[k]); b.setAttribute('aria-pressed', String(cats[k]));
      draw();
    });

    function pick(n) {
      sel = n;
      detail.innerHTML = F.topicDetail(n, data);
      each(detail.querySelectorAll('.chip'), function (c) {
        c.addEventListener('click', function () {
          var t = data.nodes.find(function (x) { return x.id === c.getAttribute('data-id'); });
          if (t) pick(t);
        });
      });
      if (window.innerWidth < 900) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function draw() {
      if (!data) return;
      F.renderGrid(gridBox, data, { cats: cats, onSelect: pick });
      if (sel && cats[sel.cat] === false) {
        sel = null;
        detail.innerHTML = '<p class="detail__hint">Tap a trend card to see the stories behind it, each linking to the outlet that ran it.</p>';
      }
    }

    var t = null;
    var update = function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (!F.feed.items.length) {
          if (F.feed.status === 'error') $('trendStat').textContent = 'The newsroom feeds are not answering right now. Try again in a minute.';
          return;
        }
        data = F.topicsFromFeed({ max: 32 });
        var newest = F.feed.updated ? F.timeAgo(F.feed.updated) : 'just now';
        $('trendStat').textContent = 'Based on ' + data.items + ' headlines from ' + data.sources.length + ' outlets. Updated ' + newest + '.';
        if (data.nodes[0]) {
          $('bubbleMood').textContent = F.view === 'pro' ? 'Leading topic: ' + data.nodes[0].label : data.nodes[0].label + ' is glowing';
          $('bubbleLine').textContent = data.nodes[0].mentions + ' stories from ' + data.nodes[0].sources + ' outlets.';
        }
        $('srcList').innerHTML = data.sources.map(function (s) { return '<span class="src' + (s.type === 'official' ? ' src--off' : '') + '"><b>' + esc(s.name) + '</b><em>' + s.n + ' headlines' + (s.type === 'official' ? ' &middot; Official' : '') + '</em></span>'; }).join('');
        draw();
      }, 250);
    };
    F.on('feeds', update); F.on('view', update);
    F.reveal();
    F.startFeeds();
    F.watch(F.TICK_SYMS);
  }

  /* ---------- home ---------- */
  function renderHome() {
    var heroFish = $('heroFish');
    if (heroFish) heroFish.innerHTML = F.creature('home');

    var ponds = [
      { k: 'uk', pro: 'UK equities, sterling and official economic releases.', blurb: 'Sterling, the FTSE crowd and the news that moves them.', sym: 'EWU', label: 'UK stocks' },
      { k: 'us', pro: 'US indices, leading companies and macro market signals.', blurb: 'Wall Street, the big names, plus gold, oil and the dollar.', sym: 'SPY', label: 'S&P 500' },
      { k: 'europe', pro: 'Euro-area funds and major continental companies.', blurb: 'The euro area, Germany, France and the continent\'s giants.', sym: 'FEZ', label: 'Euro Stoxx 50' },
      { k: 'asia', pro: 'Asia-Pacific markets, manufacturers and technology leaders.', blurb: 'Tokyo, Hong Kong, Mumbai and the chipmakers.', sym: 'EWJ', label: 'Japan' },
      { k: 'crypto', pro: 'Digital assets, market capitalisation and 24-hour moves.', blurb: 'The market that never sleeps, priced in pounds.', coin: 'btc', label: 'Bitcoin' },
      { k: 'trends', pro: 'Ranked financial-news coverage across monitored publishers.', blurb: 'A ranked pulse of what everyone is talking about.', label: 'Hot right now' }
    ];
    var host = $('ponds');
    host.innerHTML = ponds.map(function (p, i) {
      var pg = F.PAGES[p.k];
      return '<a class="pond reveal" href="' + pg.href + '" style="--c:' + pg.color + ';--tilt:' + (((i * 3) % 5) - 2) * 0.5 + 'deg" data-pond="' + p.k + '">' +
        '<span class="pond__art">' + F.creature(p.k) + '</span>' +
        '<span class="pond__num">0' + (i + 1) + '</span><b class="pond__name">' + esc(p.k === 'uk' ? 'The UK' : p.k === 'us' ? 'The US' : pg.label) + '</b>' +
        '<span class="pond__blurb">' + F.copy(p.pro, p.blurb) + '</span>' +
        '<span class="pond__stat"><span class="pond__label">' + esc(p.label) + '</span>' + (p.k === 'trends' ? '<span class="pond__top" id="pondTop">Scanning the news</span>' : '<span class="price">--</span><span class="pct flat">--</span>') + '</span>' +
        '<span class="pond__go">' + F.copy('Open market', 'Dive in') + ' <svg width="26" height="10" viewBox="0 0 34 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M0 5h32M28 1l4 4-4 4"/></svg></span></a>';
    }).join('');
    each(host.querySelectorAll('.pond'), function (elx) {
      var k = elx.getAttribute('data-pond'), p = ponds.filter(function (x) { return x.k === k; })[0];
      if (p.sym) F.bind(elx, function () { return F.quotes[p.sym]; }, { cur: '$', abs: false });
      else if (p.coin) F.bind(elx, function () { return F.coinOf(p.coin); }, { cur: F.curSym });
    });
    each(document.querySelectorAll('[data-stick]'), function (elx) {
      var sym = elx.getAttribute('data-stick');
      if (sym === 'GBPUSD') F.bind(elx, function () { for (var i = 0; i < F.fx.pairs.length; i++) { if (F.fx.pairs[i].code === 'USD') return { price: F.fx.pairs[i].rate, pct: F.fx.pairs[i].pct, hi: 0, lo: 0 }; } return null; }, { cur: '', abs: false });
      else if (sym === 'BTC') F.bind(elx, function () { return F.coinOf('btc'); }, { cur: F.curSym });
      else F.bind(elx, function () { return F.quotes[sym]; }, { cur: '$' });
    });
    paintBadges();
    F.watch(['EWU', 'SPY', 'FEZ', 'EWJ'].concat(F.TICK_SYMS));

    var paintNews = function () {
      var list = F.feed.items.filter(function (it) { return it.type !== 'official'; }).slice(0, 6);
      $('cards').innerHTML = list.map(cardHTML).join('') || '<p class="empty">' + (F.feed.status === 'error' ? 'The newsroom feeds are not answering right now.' : 'Fishing for headlines...') + '</p>';
    };
    var trendT = null;
    var paintTrends = function () {
      clearTimeout(trendT);
      trendT = setTimeout(function () {
        if (F.feed.items.length < 20) return;
        var data = F.topicsFromFeed({ max: 16 });
        if (!data.nodes.length) return;
        $('pondTop') && ($('pondTop').textContent = data.nodes[0].label);

        var box = $('trendBars');
        if (box) {
          var top = Math.max(1, data.nodes[0].mentions);
          box.innerHTML = '<h3>' + F.copy('Coverage frequency', 'Most mentioned topics') + '</h3><ol class="trendbars__list">' +
            data.nodes.slice(0, 6).map(function (n, i) {
              var w = Math.max(10, Math.round(n.mentions / top * 100));
              return '<li class="trendbar" style="--c:' + F.CATS[n.cat].color + '">' +
                '<span class="trendbar__rank">' + (i + 1) + '</span>' +
                '<span class="trendbar__label"><b>' + esc(n.label) + '</b><em>' + n.mentions + ' stories</em></span>' +
                '<span class="trendbar__track" aria-hidden="true"><i style="width:' + w + '%"></i></span></li>';
            }).join('') + '</ol>';
        }

      }, 300);
    };
    F.on('feeds', paintNews); F.on('feeds', paintTrends); paintNews();
    F.on('mode', paintBadges);
    F.reveal();
    F.startFeeds();
  }

  /* ---------- boot ---------- */
  F.on('mode', paintBadges);
  F.on('tick', paintBadges);
  F.on('coins', paintBadges);
  F.watch(F.TICK_SYMS);

  if (P[page]) renderPond(P[page]);
  else if (page === 'crypto') renderCrypto();
  else if (page === 'trends') renderTrends();
  else renderHome();

  paintHours(); setInterval(paintHours, 30000);
  paintBadges();
  F.startMarkets();
  F.loadFx();
  F.startCrypto();
  window.addEventListener('load', function () { F.reveal(); });
})();
