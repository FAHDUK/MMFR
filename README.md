# FRMM: Markets, beneath the surface

A static site (plain HTML, CSS and JavaScript) for GitHub Pages. UK, US, Europe, Asia and Crypto pages, each with the top 50 companies or coins, movers, index charts and currency conversions. One theme: dark.

Nothing to build. Open `index.html` through a web server (or GitHub Pages). Opening the file straight from disk works for the demo numbers, but browsers block live data from `file://`.

## Where the numbers come from

| What | Source | Key needed |
| --- | --- | --- |
| Shares and indices | Yahoo Finance, through your own Cloudflare Worker | No key. See below |
| Crypto | CoinGecko public API | No |
| Currency conversions | Frankfurter (European Central Bank rates) | No |
| Headlines and trends | BBC, Guardian, Sky, FT, Economist, CNBC, Bank of England, CoinDesk, Cointelegraph RSS, read through rss2json | No |

Until `WORKER_URL` is set, shares and indices show demo numbers and the badge in the top strip says **Demo data**. Crypto and currencies go live straight away.

## Turn on live shares (about 10 minutes, free)

Yahoo does not issue keys and blocks requests from web pages, so a tiny relay does the asking for the site.

1. Make a free account at <https://dash.cloudflare.com>.
2. Go to **Workers and Pages**, then **Create**, then **Create Worker**. Name it `frmm-yahoo` and press **Deploy**.
3. Press **Edit code**, delete what is there, paste in the whole of `worker/worker.js`, then **Deploy**.
4. Copy the address it gives you, for example `https://frmm-yahoo.your-name.workers.dev`. Visit `/health` on it to check it says `ok`, then `/q?s=AAPL` to see a price.
5. Open `js/config.js` and paste that address into `WORKER_URL`. Commit. Refresh the site. The badge should change to **Live, delayed**.

If the site is served from anywhere other than `fahduk.github.io` or `fahd.uk`, add the address in the Worker under **Settings, Variables**, as `ALLOWED_ORIGINS` (comma separated, for example `https://example.com`).

The Worker caches every answer for about a minute, so the free plan (100,000 requests a day) is plenty for a personal site.

## Things worth knowing

- This uses Yahoo's unofficial chart endpoint. It is free and delayed (often 15 minutes for London), it can change or break without notice, and Yahoo's terms limit it to personal use. If FRMM becomes a public product, move to a licensed feed (Financial Modeling Prep, EODHD or Twelve Data are the usual choices) and only `worker/worker.js` needs to change.
- Any symbol Yahoo does not recognise shows `n/a` rather than a made-up number. The FTSE index symbols (`^FTSE`, `^FTMC`, `^FTLC`, `^FTAS`, `^FTAI`) are the ones to check first; edit them in `js/data.js` if one shows `n/a`.
- Asia's conversion strip uses the yen (¥100). Change it in `F.CONV.asia` in `js/data.js` if you prefer another currency.
- Nothing secret lives in the site. The old Finnhub key is no longer used, so you can revoke it.

## Files

- `index.html`, `css/app.css`: page shell and the dark theme (fonts are self-hosted so every phone draws the same letters).
- `js/config.js`: the one setting, `WORKER_URL`.
- `js/data.js`: the top 50 for each region (Yahoo symbol, name, sector, exchange), indices, conversions, news sources and topics.
- `js/core.js`, `js/live.js`, `js/views.js`, `js/app.js`: helpers, data loading, pages and router.
- `worker/worker.js`: the Cloudflare Worker.
