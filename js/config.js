/*
  FRMM configuration
  ------------------
  The Finnhub key below powers live US stocks, indices and UK ADRs, so the
  DEMO data never appears. Crypto (Binance + CoinGecko) and news (publisher RSS)
  need no key.

  Anyone can also paste a different key from the menu (top right). That is
  stored in their own browser and takes priority over this file.

  Note: this file is public once the site is on GitHub Pages, so treat the key
  as a free, low-risk one. If it ever leaks, regenerate it on finnhub.io.
*/
window.FRMM_CONFIG = {
  FINNHUB_KEY: "dampnh9r01qn0fq83mngdampnh9r01qn0fq83mo0",

  // How often (ms) the slower REST sources refresh
  COINS_REFRESH_MS: 60 * 1000,
  NEWS_REFRESH_MS: 4 * 60 * 1000,

  // Finnhub free plan allows 60 calls a minute. 1100ms stays just under.
  FINNHUB_SPACING_MS: 1100
};
