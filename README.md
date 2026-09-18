# FRMM

**Markets, beneath the surface.** A playful, UK-flavoured live market tracker with a deep-sea theme. Plain HTML, CSS and JavaScript, no build step.

## Pages

| Page | What it shows |
| --- | --- |
| `index.html` | Home: pick a pond, a mini web of what is trending, top headlines |
| `uk.html` | UK shares (via US-listed proxies), sterling corner, the official desk (Bank of England, ONS, HM Treasury), UK news |
| `us.html` | Wall Street indices, big names, gold, oil, dollar, bonds |
| `europe.html` | Euro area funds and continental giants |
| `asia.html` | Japan, China, Hong Kong, India and regional giants |
| `crypto.html` | Top coins in pounds or dollars, with 7 day sparklines |
| `trends.html` | A web and a grid of the topics dominating the news, each linking to the original stories |

## Run it

Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

## Data sources

| Data | Source | Key |
| --- | --- | --- |
| Shares, ETFs, ADRs | Finnhub (free plan, US-listed only) | Yes, in `js/config.js` |
| Sterling exchange rates | ECB reference rates via frankfurter.dev | No |
| Crypto | CoinGecko | No |
| Headlines | BBC News, The Guardian, Sky News, Financial Times, The Economist, CNBC, Bank of England, ONS, HM Treasury (RSS via rss2json), plus Reuters and others through Finnhub market news | No |

UK, European and Asian markets are followed through US-listed funds and company listings, so those prices are in dollars. Direct London prices need a paid data plan.

## How the trends web works

`js/trends.js` matches headlines from the last 36 hours against a list of about 40 topics, adds names that several outlets mention, and draws bubbles sized by story count. Lines join topics that appear in the same headline. It shows what is being covered, not whether it is important or true.

## The Finnhub key

The key is in `js/config.js`, so anyone can see it. It is a free key, and the free plan allows 60 calls a minute, shared by every visitor. If it is misused, regenerate it on finnhub.io. Visitors can also paste their own key from the menu; it stays in their browser.

## Files

`css/styles.css` all styling. `js/core.js` helpers and cache. `js/markets.js` stock quotes and market hours. `js/data.js` exchange rates and crypto. `js/feeds.js` news sources. `js/trends.js` topic finder and web. `js/ui.js` header, ticker, mascots and footer. `js/page.js` builds each page.
