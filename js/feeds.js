/* FRMM feeds: headlines from reputable publishers and official bodies.
   RSS is read through rss2json (no key). Finnhub market news (with your key) adds Reuters and others.
   Every item keeps its original link, so a click goes straight to the source. */
(function () {
  'use strict';

  var F = window.FRMM;
  var RSS = 'https://api.rss2json.com/v1/api.json?rss_url=';

  /* type: press | official.  tags describe what the feed is about. */
  F.SOURCES = [
    { id: 'bbc-biz', name: 'BBC News', type: 'press', tags: ['uk', 'markets', 'economy'], url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { id: 'bbc-eco', name: 'BBC News', type: 'press', tags: ['uk', 'economy'], url: 'https://feeds.bbci.co.uk/news/business/economy/rss.xml' },
    { id: 'gdn-biz', name: 'The Guardian', type: 'press', tags: ['uk', 'markets'], url: 'https://www.theguardian.com/uk/business/rss' },
    { id: 'gdn-eco', name: 'The Guardian', type: 'press', tags: ['economy'], url: 'https://www.theguardian.com/business/economics/rss' },
    { id: 'sky', name: 'Sky News', type: 'press', tags: ['uk', 'markets'], url: 'https://feeds.skynews.com/feeds/rss/business.xml' },
    { id: 'ft-mkts', name: 'Financial Times', type: 'press', tags: ['markets'], url: 'https://www.ft.com/markets?format=rss' },
    { id: 'ft-uk', name: 'Financial Times', type: 'press', tags: ['uk'], url: 'https://www.ft.com/world/uk?format=rss' },
    { id: 'economist', name: 'The Economist', type: 'press', tags: ['economy'], url: 'https://www.economist.com/finance-and-economics/rss.xml' },
    { id: 'cnbc', name: 'CNBC', type: 'press', tags: ['us', 'markets'], url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html' },
    { id: 'cnbc-eco', name: 'CNBC', type: 'press', tags: ['us', 'economy'], url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html' },
    { id: 'boe', name: 'Bank of England', type: 'official', tags: ['uk', 'economy'], url: 'https://www.bankofengland.co.uk/rss/news' },
    { id: 'ons', name: 'Office for National Statistics', type: 'official', tags: ['uk', 'economy'], url: 'https://www.gov.uk/government/organisations/office-for-national-statistics.atom' },
    { id: 'hmt', name: 'HM Treasury', type: 'official', tags: ['uk', 'economy'], url: 'https://www.gov.uk/government/organisations/hm-treasury.atom' },
    { id: 'cointelegraph', name: 'Cointelegraph', type: 'press', tags: ['crypto'], url: 'https://cointelegraph.com/rss' },
    { id: 'coindesk', name: 'CoinDesk', type: 'press', tags: ['crypto'], url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' }
  ];
  /* Finnhub passes many aggregators. Only these recognised names are kept. */
  var FH_ALLOW = /^(reuters|cnbc|bloomberg|financial times|ft|marketwatch|the wall street journal|wsj|associated press|ap|bbc|bbc news|the guardian|sky news)$/i;

  F.feed = { items: [], updated: 0, status: 'loading', report: {} };

  function strip(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#8217;|&rsquo;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  }
  function parseDate(s) {
    if (!s) return 0;
    var d = new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(s)) ? '' : 'Z'));
    return isNaN(d) ? 0 : d.getTime();
  }
  function normTitle(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80); }

  function fetchSource(s) {
    var cached = F.cache.get('feed.' + s.id, F.cfg.NEWS_REFRESH_MS);
    if (cached) { F.feed.report[s.id] = { ok: true, n: cached.length, cached: true }; return Promise.resolve(cached); }
    return fetch(RSS + encodeURIComponent(s.url))
      .then(function (r) { if (!r.ok) throw new Error('rss ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || j.status !== 'ok' || !j.items) throw new Error('rss bad');
        var out = j.items.map(function (it) {
          var link = F.safeUrl(it.link); if (!link || !it.title) return null;
          var img = it.thumbnail || (it.enclosure && it.enclosure.link) || '';
          return {
            title: strip(it.title), url: link, src: s.name, type: s.type, tags: s.tags, ts: parseDate(it.pubDate),
            desc: strip(it.description || '').slice(0, 220), img: /^https:/.test(img) ? img : ''
          };
        }).filter(Boolean);
        F.cache.set('feed.' + s.id, out);
        F.feed.report[s.id] = { ok: true, n: out.length };
        return out;
      })
      .catch(function (e) {
        console.warn('[FRMM] feed unavailable:', s.name, e.message);
        F.feed.report[s.id] = { ok: false, n: 0 };
        return [];
      });
  }

  function fetchFinnhub(cat, tags) {
    if (!F.key || F.stockMode === 'demo') return Promise.resolve([]);
    var cached = F.cache.get('feed.fh.' + cat, F.cfg.NEWS_REFRESH_MS);
    if (cached) return Promise.resolve(cached);
    return fetch('https://finnhub.io/api/v1/news?category=' + cat + '&token=' + encodeURIComponent(F.key))
      .then(function (r) { if (!r.ok) throw new Error('fh ' + r.status); return r.json(); })
      .then(function (arr) {
        var out = (arr || []).filter(function (n) { return FH_ALLOW.test(String(n.source || '').trim()); }).slice(0, 40).map(function (n) {
          var link = F.safeUrl(n.url); if (!link || !n.headline) return null;
          return { title: strip(n.headline), url: link, src: String(n.source).replace(/^cnbc$/i, 'CNBC').replace(/^reuters$/i, 'Reuters'), type: 'press', tags: tags, ts: (n.datetime || 0) * 1000, desc: strip(n.summary || '').slice(0, 220), img: /^https:/.test(n.image || '') ? n.image : '' };
        }).filter(Boolean);
        F.cache.set('feed.fh.' + cat, out);
        return out;
      })
      .catch(function () { return []; });
  }

  function merge(lists) {
    var seen = {}, out = [];
    lists.reduce(function (a, b) { return a.concat(b); }, [])
      .sort(function (a, b) { return b.ts - a.ts; })
      .forEach(function (n) {
        var k = normTitle(n.title);
        if (!k || seen[k]) return;
        seen[k] = 1; out.push(n);
      });
    return out;
  }

  var running = null;
  /* load(ids): which sources to read. Returns a promise. Items land in F.feed.items. */
  F.loadFeeds = function (ids) {
    var wanted = F.SOURCES.filter(function (s) { return !ids || ids.indexOf(s.id) >= 0; });
    var results = [], i = 0, active = 0;
    var p = new Promise(function (resolve) {
      var next = function () {
        if (i >= wanted.length && active === 0) return resolve();
        while (active < 3 && i < wanted.length) {
          (function (s) {
            active++;
            fetchSource(s).then(function (list) { results.push(list); active--; F.feed.items = merge([F.feed.items].concat([list])); F.emit('feeds'); setTimeout(next, 180); });
          })(wanted[i++]);
        }
      };
      next();
    });
    var fh = Promise.all([fetchFinnhub('general', ['markets', 'us']), fetchFinnhub('forex', ['markets']), fetchFinnhub('crypto', ['crypto'])]).then(function (r) {
      F.feed.items = merge([F.feed.items].concat(r)); F.emit('feeds');
    });
    return Promise.all([p, fh]).then(function () {
      var any = F.feed.items.length > 0;
      F.feed.status = any ? 'ok' : 'error';
      if (any) F.feed.updated = Date.now();
      F.emit('feeds');
    });
  };
  F.startFeeds = function (ids) {
    if (running) return running;
    running = F.loadFeeds(ids);
    setInterval(function () { F.loadFeeds(ids); }, F.cfg.NEWS_REFRESH_MS);
    return running;
  };

  /* headlines for a market page: matches the feed tags OR the keywords */
  F.headlines = function (opts) {
    var tags = opts.tags || [], re = opts.re, n = opts.n || 6, official = opts.official;
    var list = F.feed.items.filter(function (it) {
      if (official != null && (it.type === 'official') !== official) return false;
      var hay = it.title + ' ' + it.desc;
      var tagHit = tags.some(function (t) { return it.tags.indexOf(t) >= 0; });
      return re ? re.test(hay) : tagHit;
    });
    return list.slice(0, n);
  };
})();
