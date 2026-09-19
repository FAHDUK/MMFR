# FRMM

**Markets, beneath the surface.** A UK-flavoured market tracker with a deep-sea identity and two audience views. Plain HTML, CSS and JavaScript, no build step.

## Pro and Explore views

The header switch changes the whole presentation without duplicating the site:

- **Pro** is the default. It uses photorealistic fish, restrained financial styling, denser tables and more precise terminology.
- **Explore** uses the original cartoon creatures, shorter explanations, translated financial terms and fewer rows/cards at once.

The selected view is stored in the visitor's browser and follows them across every page. Both views use exactly the same underlying price and news data. Live, last-close, connecting and demonstration states are always labelled; Explore also shows a short plain-English explanation.

## Pages

| Page | What it shows |
| --- | --- |
| `index.html` | Home: choose a market, ranked news coverage and top headlines |
| `uk.html` | UK shares (via US-listed proxies), sterling corner, the official desk (Bank of England, ONS, HM Treasury), UK news |
| `us.html` | Wall Street indices, big names, gold, oil, dollar, bonds |
| `europe.html` | Euro area funds and continental giants |
| `asia.html` | Japan, China, Hong Kong, India and regional giants |
| `crypto.html` | Top coins in pounds or dollars, with 7 day sparklines |
| `trends.html` | A ranked grid of topics dominating the news, each linking to the original stories |

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

## How the trend ranking works

`js/trends.js` matches headlines from the last 36 hours against a list of about 40 topics and adds names that several outlets mention. The interface ranks topics by story count. It shows what is being covered, not whether it is important or true.

## The Finnhub key

The key is in `js/config.js`, so anyone can see it. It is a free key, and the free plan allows 60 calls a minute, shared by every visitor. If it is misused, regenerate it on finnhub.io. Visitors can also paste their own key from the menu; it stays in their browser.

## Files

`css/styles.css` contains both view systems. `js/core.js` stores the selected view, helpers and cache. `js/markets.js` handles stock quotes and market hours. `js/data.js` handles exchange rates and crypto. `js/feeds.js` handles news sources. `js/trends.js` finds and ranks topics. `js/ui.js` builds the header, switch, ticker, creatures and footer. `js/page.js` builds each page. `assets/pro/` contains the optimised photorealistic fish used by Pro view.


live site
