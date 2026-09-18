/* FRMM news: publisher RSS (via rss2json, no key) + Finnhub market news (with key).
   Every headline links straight to the original article. */
(function () {
  'use strict';

  var F = window.FRMM = window.FRMM || {};

  var RSS = 'https://api.rss2json.com/v1/api.json?rss_url=';
  var FEEDS = {
    markets: [
      { src: 'CNBC', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html' },
      { src: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
      { src: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' }
    ],
    crypto: [
      { src: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
      { src: 'Cointelegraph', url: 'https://cointelegraph.com/rss' }
    ],
    uk: [
      { src: 'BBC News', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
      { src: 'The Guardian', url: 'https://www.theguardian.com/uk/business/rss' },
      { src: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/business.xml' }
    ]
  };
  F.NEWS_FALLBACK_LINKS = [
    ['BBC Business', 'https://www.bbc.co.uk/news/business'],
    ['Financial Times', 'https://www.ft.com/markets'],
    ['Reuters Markets', 'https://www.reuters.com/markets/'],
    ['CNBC Markets', 'https://www.cnbc.com/markets/'],
    ['CoinDesk', 'https://www.coindesk.com/']
  ];

  F.news = { top: [], markets: [], crypto: [], uk: [] };
  F.newsStatus = 'loading'; // loading | ok | error
  F.newsUpdated = 0;

  function safeUrl(u) {
    try { var x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : null; } catch (e) { return null; }
  }
  function normTitle(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80); }
  function parseDate(s) {
    if (!s) return 0;
    var d = new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z'));
    return isNaN(d) ? 0 : d.getTime();
  }

  function fetchRss(feed) {
    return fetch(RSS + encodeURIComponent(feed.url))
      .then(function (r) { if (!r.ok) throw new Error('rss ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || j.status !== 'ok' || !j.items) throw new Error('rss bad');
        return j.items.map(function (it) {
          var link = safeUrl(it.link);
          if (!link) return null;
          var img = it.thumbnail || (it.enclosure && it.enclosure.link) || '';
          return { title: it.title, url: link, src: feed.src, ts: parseDate(it.pubDate), img: /^https:/.test(img) ? img : '' };
        }).filter(Boolean);
      })
      .catch(function (e) { console.warn('[FRMM] feed failed:', feed.src, e.message); return []; });
  }

  function fetchFinnhub(cat) {
    if (!F.key) return Promise.resolve([]);
    return fetch('https://finnhub.io/api/v1/news?category=' + cat + '&token=' + encodeURIComponent(F.key))
      .then(function (r) { if (!r.ok) throw new Error('fh ' + r.status); return r.json(); })
      .then(function (arr) {
        return (arr || []).slice(0, 25).map(function (n) {
          var link = safeUrl(n.url); if (!link) return null;
          return { title: n.headline, url: link, src: n.source || 'Finnhub', ts: (n.datetime || 0) * 1000, img: /^https:/.test(n.image || '') ? n.image : '' };
        }).filter(Boolean);
      })
      .catch(function () { return []; });
  }

  function merge(lists, cap) {
    var seen = {}, out = [];
    lists.reduce(function (a, b) { return a.concat(b); }, [])
      .sort(function (a, b) { return b.ts - a.ts; })
      .forEach(function (n) {
        var k = normTitle(n.title);
        if (!k || seen[k] || !n.title) return;
        seen[k] = 1; out.push(n);
      });
    return out.slice(0, cap);
  }

  F.loadNews = function () {
    var groups = ['markets', 'crypto', 'uk'];
    var jobs = groups.map(function (g) {
      var extra = g === 'markets' ? fetchFinnhub('general') : g === 'crypto' ? fetchFinnhub('crypto') : Promise.resolve([]);
      return Promise.all(FEEDS[g].map(fetchRss).concat([extra])).then(function (res) { return merge(res, 24); });
    });
    return Promise.all(jobs).then(function (res) {
      var any = false;
      groups.forEach(function (g, i) { F.news[g] = res[i]; if (res[i].length) any = true; });
      F.news.top = merge([F.news.markets.slice(0, 12), F.news.uk.slice(0, 8), F.news.crypto.slice(0, 6)], 24);
      F.newsStatus = any ? 'ok' : 'error';
      if (any) F.newsUpdated = Date.now();
      F.emit('news');
    });
  };

  F.startNews = function () {
    F.loadNews();
    setInterval(F.loadNews, F.cfg.NEWS_REFRESH_MS);
  };
})();
