# FRMM

**Markets, beneath the surface.** A live market tracker with an underwater theme: US and UK stocks, top winners and losers, crypto, and a news feed that links straight to each publisher. Plain HTML, CSS and JavaScript. No build step.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Put it on GitHub Pages

1. Create a repository and push these files to the `main` branch.
2. In the repository go to **Settings, Pages**, set the source to **Deploy from a branch**, choose `main` and `/ (root)`.
3. Your site appears at `https://<username>.github.io/<repository>/`.

## Data sources

| Panel | Source | Key needed |
| --- | --- | --- |
| US stocks, indices, UK ADRs | [Finnhub](https://finnhub.io) REST and WebSocket | Yes, free (already set in `js/config.js`) |
| Crypto | CoinGecko (7 day trends) and Binance WebSocket (live price) | No |
| News | Publisher RSS feeds through rss2json, plus Finnhub market news | No |

Every headline links to the original article.

UK exposure uses the iShares MSCI UK ETF (EWU) and US-listed UK companies (ADRs), priced in dollars. Direct London Stock Exchange prices need a paid data plan.

## The Finnhub key

The key lives in `js/config.js`, so the site shows live data with no DEMO labels. Because this is a static site, the key is visible to anyone who views the source. Use a free key only, and regenerate it on finnhub.io if it is ever misused. Visitors can also paste their own key from the menu; it is stored in their browser only and takes priority.

The free plan allows 60 calls a minute, so the site polls one symbol at a time and uses the WebSocket for live trades while the US market is open. Outside market hours you see the last close.

If Finnhub rejects the key, stock panels fall back to clearly labelled DEMO data.

## Files

```
index.html        page structure
css/styles.css    design
js/config.js      Finnhub key and refresh timings
js/markets.js     stocks and crypto data layer
js/news.js        news feeds
js/ocean.js       specks, bubbles, depth rail, scroll effects
js/app.js         renders panels, movers, news and the menu
assets/           photos and favicon
```

## Credits

Betta photographs are the ones supplied for this project. Check you hold the rights to any image you publish. Fonts: Playfair Display and Montserrat via Google Fonts.

FRMM is an information tool, not financial advice. Prices may be delayed and can be wrong.



LIVE SITE
