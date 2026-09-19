/* FRMM data: what each market page shows.
   Every company line is:  Yahoo symbol | name | sector | exchange | demo price [| price prefix]
   The demo price is only used when live data cannot be reached. Order is roughly by size. */
(function () {
  'use strict';
  var F = window.FRMM = window.FRMM || {};

  function parse(text, defCur) {
    return text.trim().split('\n').map(function (line, i) {
      var p = line.trim().split('|');
      return { ys: p[0], t: p[0].replace(/\.[A-Z]{1,2}$/, ''), n: p[1], sec: p[2], ix: p[3], px: +p[4], cur: p[5] != null ? p[5] : defCur, rank: i + 1 };
    });
  }

  var UK = parse([
    'AZN.L|AstraZeneca|Health care|FTSE 100|11450',
    'SHEL.L|Shell|Energy|FTSE 100|2712',
    'HSBA.L|HSBC|Financials|FTSE 100|905',
    'ULVR.L|Unilever|Consumer staples|FTSE 100|4520',
    'BP.L|BP|Energy|FTSE 100|438',
    'RIO.L|Rio Tinto|Basic materials|FTSE 100|4890',
    'GSK.L|GSK|Health care|FTSE 100|1620',
    'BATS.L|British American Tobacco|Consumer staples|FTSE 100|3480',
    'DGE.L|Diageo|Consumer staples|FTSE 100|2120',
    'REL.L|RELX|Industrials|FTSE 100|3980',
    'LSEG.L|London Stock Exchange Group|Financials|FTSE 100|10120',
    'NG.L|National Grid|Utilities|FTSE 100|1090',
    'BARC.L|Barclays|Financials|FTSE 100|292',
    'LLOY.L|Lloyds Banking Group|Financials|FTSE 100|61',
    'GLEN.L|Glencore|Basic materials|FTSE 100|358',
    'CPG.L|Compass Group|Consumer discretionary|FTSE 100|2500',
    'RR.L|Rolls-Royce|Industrials|FTSE 100|1000',
    'BA.L|BAE Systems|Industrials|FTSE 100|1410',
    'NWG.L|NatWest Group|Financials|FTSE 100|452',
    'AAL.L|Anglo American|Basic materials|FTSE 100|2380',
    'TSCO.L|Tesco|Consumer staples|FTSE 100|366',
    'STAN.L|Standard Chartered|Financials|FTSE 100|1450',
    'PRU.L|Prudential|Financials|FTSE 100|1000',
    'IMB.L|Imperial Brands|Consumer staples|FTSE 100|3000',
    'EXPN.L|Experian|Industrials|FTSE 100|3500',
    'III.L|3i Group|Financials|FTSE 100|4000',
    'AHT.L|Ashtead Group|Industrials|FTSE 100|5000',
    'SSE.L|SSE|Utilities|FTSE 100|1830',
    'LGEN.L|Legal & General|Financials|FTSE 100|240',
    'VOD.L|Vodafone|Telecoms|FTSE 100|72',
    'NXT.L|Next|Consumer discretionary|FTSE 100|12500',
    'HLN.L|Haleon|Consumer staples|FTSE 100|360',
    'BT-A.L|BT Group|Telecoms|FTSE 100|190',
    'ABF.L|Associated British Foods|Consumer staples|FTSE 100|2000',
    'SGE.L|Sage Group|Technology|FTSE 100|1150',
    'AV.L|Aviva|Financials|FTSE 100|620',
    'SMT.L|Scottish Mortgage|Financials|FTSE 100|1000',
    'RKT.L|Reckitt|Consumer staples|FTSE 100|5000',
    'BNZL.L|Bunzl|Industrials|FTSE 100|2400',
    'PSON.L|Pearson|Consumer discretionary|FTSE 100|1100',
    'SMIN.L|Smiths Group|Industrials|FTSE 100|2300',
    'INF.L|Informa|Consumer discretionary|FTSE 100|900',
    'ITRK.L|Intertek|Industrials|FTSE 100|4800',
    'IHG.L|InterContinental Hotels|Consumer discretionary|FTSE 100|9000',
    'KGF.L|Kingfisher|Consumer discretionary|FTSE 100|300',
    'UU.L|United Utilities|Utilities|FTSE 100|1100',
    'SVT.L|Severn Trent|Utilities|FTSE 100|2500',
    'MKS.L|Marks and Spencer|Consumer discretionary|FTSE 100|380',
    'ANTO.L|Antofagasta|Basic materials|FTSE 100|2200',
    'ADM.L|Admiral Group|Financials|FTSE 100|3400'
  ].join('\n'), 'p');

  var US = parse([
    'AAPL|Apple|Technology|Nasdaq|233.4', 'MSFT|Microsoft|Technology|Nasdaq|512.8', 'NVDA|NVIDIA|Technology|Nasdaq|176.2',
    'AMZN|Amazon|Consumer discretionary|Nasdaq|235.4', 'GOOGL|Alphabet|Communications|Nasdaq|261.4', 'META|Meta Platforms|Communications|Nasdaq|735.2',
    'AVGO|Broadcom|Technology|Nasdaq|331.6', 'TSLA|Tesla|Consumer discretionary|Nasdaq|349.3', 'BRK-B|Berkshire Hathaway|Financials|NYSE|480.1',
    'LLY|Eli Lilly|Health care|NYSE|812.9', 'JPM|JPMorgan Chase|Financials|NYSE|296.4', 'V|Visa|Financials|NYSE|341.2',
    'WMT|Walmart|Consumer staples|NYSE|98.6', 'XOM|ExxonMobil|Energy|NYSE|112.4', 'UNH|UnitedHealth Group|Health care|NYSE|322.7',
    'MA|Mastercard|Financials|NYSE|573.1', 'ORCL|Oracle|Technology|NYSE|271.6', 'COST|Costco|Consumer staples|Nasdaq|928.3',
    'HD|Home Depot|Consumer discretionary|NYSE|391.5', 'PG|Procter & Gamble|Consumer staples|NYSE|152.3', 'JNJ|Johnson & Johnson|Health care|NYSE|172.8',
    'NFLX|Netflix|Communications|Nasdaq|1198.4', 'BAC|Bank of America|Financials|NYSE|49.7', 'ABBV|AbbVie|Health care|NYSE|210.6',
    'CRM|Salesforce|Technology|NYSE|245.1', 'CVX|Chevron|Energy|NYSE|155.2', 'KO|Coca-Cola|Consumer staples|NYSE|67.8',
    'AMD|AMD|Technology|Nasdaq|158.9', 'TMUS|T-Mobile US|Communications|Nasdaq|240.4', 'WFC|Wells Fargo|Financials|NYSE|80.3',
    'CSCO|Cisco|Technology|Nasdaq|68.1', 'PEP|PepsiCo|Consumer staples|Nasdaq|143.2', 'MRK|Merck|Health care|NYSE|95.7',
    'ACN|Accenture|Technology|NYSE|260.5', 'ADBE|Adobe|Technology|Nasdaq|340.2', 'LIN|Linde|Basic materials|Nasdaq|465.4',
    'MCD|McDonald\'s|Consumer discretionary|NYSE|305.6', 'NOW|ServiceNow|Technology|NYSE|900.8', 'IBM|IBM|Technology|NYSE|260.3',
    'GE|GE Aerospace|Industrials|NYSE|275.9', 'ABT|Abbott Laboratories|Health care|NYSE|130.4', 'DIS|Walt Disney|Communications|NYSE|113.5',
    'CAT|Caterpillar|Industrials|NYSE|470.2', 'PM|Philip Morris International|Consumer staples|NYSE|160.7', 'QCOM|Qualcomm|Technology|Nasdaq|165.9',
    'INTU|Intuit|Technology|Nasdaq|650.4', 'TXN|Texas Instruments|Technology|Nasdaq|180.6', 'VZ|Verizon|Communications|NYSE|43.2',
    'AXP|American Express|Financials|NYSE|330.8', 'GS|Goldman Sachs|Financials|NYSE|730.1'
  ].join('\n'), '$');

  var EU = parse([
    'ASML.AS|ASML|Technology|Amsterdam|862.4', 'SAP.DE|SAP|Technology|Xetra|231.6', 'NOVO-B.CO|Novo Nordisk|Health care|Copenhagen|410.2|kr ',
    'MC.PA|LVMH|Consumer discretionary|Paris|561.3', 'NESN.SW|Nestl\u00e9|Consumer staples|Swiss Exchange|88.4|CHF ', 'ROG.SW|Roche|Health care|Swiss Exchange|260.5|CHF ',
    'NOVN.SW|Novartis|Health care|Swiss Exchange|100.2|CHF ', 'SIE.DE|Siemens|Industrials|Xetra|224.9', 'OR.PA|L\'Or\u00e9al|Consumer staples|Paris|372.8',
    'RMS.PA|Herm\u00e8s|Consumer discretionary|Paris|2340', 'TTE.PA|TotalEnergies|Energy|Paris|54.7', 'SAN.PA|Sanofi|Health care|Paris|85.3',
    'AIR.PA|Airbus|Industrials|Paris|193.4', 'ALV.DE|Allianz|Financials|Xetra|361.5', 'IBE.MC|Iberdrola|Utilities|Madrid|16.2',
    'SU.PA|Schneider Electric|Industrials|Paris|236.5', 'DTE.DE|Deutsche Telekom|Telecoms|Xetra|30.1', 'UBSG.SW|UBS|Financials|Swiss Exchange|28.4|CHF ',
    'SAN.MC|Banco Santander|Financials|Madrid|8.4', 'MUV2.DE|Munich Re|Financials|Xetra|540.2', 'BNP.PA|BNP Paribas|Financials|Paris|82.6',
    'CS.PA|AXA|Financials|Paris|40.1', 'ITX.MC|Inditex|Consumer discretionary|Madrid|49.8', 'EL.PA|EssilorLuxottica|Health care|Paris|280.4',
    'RACE.MI|Ferrari|Consumer discretionary|Milan|400.6', 'ENEL.MI|Enel|Utilities|Milan|8.6', 'UCG.MI|UniCredit|Financials|Milan|62.4',
    'ISP.MI|Intesa Sanpaolo|Financials|Milan|5.1', 'BBVA.MC|BBVA|Financials|Madrid|13.7', 'SAF.PA|Safran|Industrials|Paris|290.3',
    'ADYEN.AS|Adyen|Financials|Amsterdam|1400.5', 'AI.PA|Air Liquide|Basic materials|Paris|180.2', 'DG.PA|Vinci|Industrials|Paris|125.6',
    'CFR.SW|Richemont|Consumer discretionary|Swiss Exchange|170.3|CHF ', 'ZURN.SW|Zurich Insurance|Financials|Swiss Exchange|550.7|CHF ', 'IFX.DE|Infineon|Technology|Xetra|35.2',
    'ADS.DE|Adidas|Consumer discretionary|Xetra|187.3', 'MBG.DE|Mercedes-Benz|Consumer discretionary|Xetra|56.2', 'BMW.DE|BMW|Consumer discretionary|Xetra|85.4',
    'INGA.AS|ING Groep|Financials|Amsterdam|19.1', 'ABI.BR|AB InBev|Consumer staples|Brussels|55.3', 'KER.PA|Kering|Consumer discretionary|Paris|260.8',
    'DHL.DE|DHL Group|Industrials|Xetra|42.6', 'ENGI.PA|Engie|Utilities|Paris|20.4', 'DB1.DE|Deutsche B\u00f6rse|Financials|Xetra|235.9',
    'EOAN.DE|E.ON|Utilities|Xetra|16.3', 'BN.PA|Danone|Consumer staples|Paris|78.5', 'AD.AS|Ahold Delhaize|Consumer staples|Amsterdam|35.2',
    'RI.PA|Pernod Ricard|Consumer staples|Paris|95.4', 'ENI.MI|Eni|Energy|Milan|15.2'
  ].join('\n'), '\u20ac');

  var AS = parse([
    '7203.T|Toyota Motor|Consumer discretionary|Tokyo|2760|\u00a5', '6758.T|Sony Group|Technology|Tokyo|4020|\u00a5', '8306.T|Mitsubishi UFJ Financial|Financials|Tokyo|1890|\u00a5',
    '9984.T|SoftBank Group|Communications|Tokyo|13450|\u00a5', '6861.T|Keyence|Technology|Tokyo|62000|\u00a5', '8035.T|Tokyo Electron|Technology|Tokyo|26800|\u00a5',
    '9983.T|Fast Retailing|Consumer discretionary|Tokyo|51200|\u00a5', '6501.T|Hitachi|Industrials|Tokyo|4100|\u00a5', '7974.T|Nintendo|Communications|Tokyo|13000|\u00a5',
    '8058.T|Mitsubishi Corporation|Industrials|Tokyo|3000|\u00a5', '6098.T|Recruit Holdings|Industrials|Tokyo|8500|\u00a5', '4063.T|Shin-Etsu Chemical|Basic materials|Tokyo|5000|\u00a5',
    '8316.T|Sumitomo Mitsui Financial|Financials|Tokyo|4300|\u00a5', '9432.T|NTT|Telecoms|Tokyo|155|\u00a5', '7267.T|Honda Motor|Consumer discretionary|Tokyo|1500|\u00a5',
    '0700.HK|Tencent|Communications|Hong Kong|612.4|HK$', '9988.HK|Alibaba|Consumer discretionary|Hong Kong|148.2|HK$', '1299.HK|AIA Group|Financials|Hong Kong|75.6|HK$',
    '0939.HK|China Construction Bank|Financials|Hong Kong|7.3|HK$', '3690.HK|Meituan|Consumer discretionary|Hong Kong|131.5|HK$', '1810.HK|Xiaomi|Technology|Hong Kong|52.3|HK$',
    '0005.HK|HSBC Holdings|Financials|Hong Kong|98.6|HK$', '1398.HK|ICBC|Financials|Hong Kong|5.9|HK$', '0941.HK|China Mobile|Telecoms|Hong Kong|80.2|HK$',
    '1211.HK|BYD|Consumer discretionary|Hong Kong|105.4|HK$', '2318.HK|Ping An Insurance|Financials|Hong Kong|52.1|HK$', '9618.HK|JD.com|Consumer discretionary|Hong Kong|130.3|HK$',
    '300750.SZ|CATL|Industrials|Shenzhen|260.5|CN\u00a5', '600519.SS|Kweichow Moutai|Consumer staples|Shanghai|1468|CN\u00a5',
    '2330.TW|TSMC|Technology|Taiwan|1100|NT$', '2317.TW|Hon Hai Precision|Technology|Taiwan|200.5|NT$', '2454.TW|MediaTek|Technology|Taiwan|1400|NT$',
    '005930.KS|Samsung Electronics|Technology|Korea|79400|\u20a9', '000660.KS|SK Hynix|Technology|Korea|231000|\u20a9', '373220.KS|LG Energy Solution|Industrials|Korea|380000|\u20a9',
    'RELIANCE.NS|Reliance Industries|Energy|India|1385|\u20b9', 'HDFCBANK.NS|HDFC Bank|Financials|India|1005|\u20b9', 'TCS.NS|Tata Consultancy Services|Technology|India|3120|\u20b9',
    'ICICIBANK.NS|ICICI Bank|Financials|India|1400|\u20b9', 'BHARTIARTL.NS|Bharti Airtel|Telecoms|India|1900|\u20b9', 'INFY.NS|Infosys|Technology|India|1490|\u20b9',
    'SBIN.NS|State Bank of India|Financials|India|850|\u20b9',
    'BHP.AX|BHP Group|Basic materials|Australia|43.2|A$', 'CBA.AX|Commonwealth Bank|Financials|Australia|170.4|A$', 'CSL.AX|CSL|Health care|Australia|250.6|A$',
    'WBC.AX|Westpac|Financials|Australia|34.1|A$', 'NAB.AX|National Australia Bank|Financials|Australia|40.3|A$', 'WES.AX|Wesfarmers|Consumer discretionary|Australia|88.7|A$',
    'D05.SI|DBS Group|Financials|Singapore|45.2|S$', 'O39.SI|OCBC|Financials|Singapore|17.1|S$'
  ].join('\n'), '');

  /* Crypto: CoinGecko id | symbol | name | category | demo price in pounds */
  var COINS = [
    'bitcoin|BTC|Bitcoin|Store of value|82340', 'ethereum|ETH|Ethereum|Smart contracts|2910', 'tether|USDT|Tether|Stablecoin|0.75', 'ripple|XRP|XRP|Payments|1.95',
    'binancecoin|BNB|BNB|Exchange|612', 'solana|SOL|Solana|Smart contracts|148', 'usd-coin|USDC|USD Coin|Stablecoin|0.75', 'dogecoin|DOGE|Dogecoin|Meme|0.18',
    'tron|TRX|TRON|Smart contracts|0.23', 'cardano|ADA|Cardano|Smart contracts|0.56', 'chainlink|LINK|Chainlink|Infrastructure|16.4', 'avalanche-2|AVAX|Avalanche|Smart contracts|24.6',
    'stellar|XLM|Stellar|Payments|0.29', 'sui|SUI|Sui|Smart contracts|2.9', 'shiba-inu|SHIB|Shiba Inu|Meme|0.0000105', 'hedera-hashgraph|HBAR|Hedera|Smart contracts|0.16',
    'bitcoin-cash|BCH|Bitcoin Cash|Payments|380', 'litecoin|LTC|Litecoin|Payments|78.1', 'polkadot|DOT|Polkadot|Infrastructure|4.1', 'uniswap|UNI|Uniswap|DeFi|7.3',
    'near|NEAR|NEAR Protocol|Smart contracts|2.9', 'aave|AAVE|Aave|DeFi|218', 'internet-computer|ICP|Internet Computer|Infrastructure|4.6', 'ethereum-classic|ETC|Ethereum Classic|Smart contracts|15.8',
    'monero|XMR|Monero|Privacy|260', 'pepe|PEPE|Pepe|Meme|0.0000078', 'aptos|APT|Aptos|Smart contracts|4.4', 'arbitrum|ARB|Arbitrum|Infrastructure|0.38',
    'cosmos|ATOM|Cosmos|Infrastructure|3.8', 'filecoin|FIL|Filecoin|Infrastructure|2.4', 'vechain|VET|VeChain|Infrastructure|0.021', 'algorand|ALGO|Algorand|Smart contracts|0.19',
    'render-token|RENDER|Render|Infrastructure|3.6', 'kaspa|KAS|Kaspa|Smart contracts|0.062', 'optimism|OP|Optimism|Infrastructure|0.72', 'maker|MKR|Maker|DeFi|1210',
    'injective-protocol|INJ|Injective|DeFi|10.5', 'the-graph|GRT|The Graph|Infrastructure|0.085', 'blockstack|STX|Stacks|Smart contracts|0.68', 'celestia|TIA|Celestia|Infrastructure|1.7',
    'sei-network|SEI|Sei|Smart contracts|0.22', 'bonk|BONK|Bonk|Meme|0.000015', 'fetch-ai|FET|Artificial Superintelligence Alliance|Infrastructure|0.52', 'theta-token|THETA|Theta Network|Infrastructure|0.75',
    'lido-dao|LDO|Lido DAO|DeFi|0.68', 'quant-network|QNT|Quant|Infrastructure|72', 'immutable-x|IMX|Immutable|Infrastructure|0.98', 'the-sandbox|SAND|The Sandbox|Gaming|0.24',
    'floki|FLOKI|FLOKI|Meme|0.00008', 'gala|GALA|Gala|Gaming|0.011'
  ].map(function (l, i) {
    var p = l.split('|');
    return { id: p[0], ys: p[1], t: p[1], n: p[2], sec: p[3], ix: i < 5 ? 'Top 5' : i < 20 ? 'Top 20' : 'Top 50', px: +p[4], cur: '\u00a3', rank: i + 1 };
  });

  F.ORDER = ['uk', 'us', 'europe', 'asia', 'crypto'];

  F.MK = {
    uk: { k: 'uk', label: 'UK', name: 'The UK', title: 'United Kingdom', coin: '\u00a3', tone: '#ffb020', ex: 'London Stock Exchange', tz: 'Europe/London', open: [8, 0, 16, 30], hrs: '08:00 to 16:30', cur: 'p', sd: 1.3, per: 'companies',
      idx: [['FTSE 100', '^FTSE', 8412.3], ['FTSE 250', '^FTMC', 20874.6], ['FTSE 350', '^FTLC', 4620.1], ['FTSE All-Share', '^FTAS', 4641.9], ['FTSE AIM All-Share', '^FTAI', 742.5]], cos: UK, tags: ['uk'] },
    us: { k: 'us', label: 'US', name: 'The US', title: 'United States', coin: '$', tone: '#3ddc97', ex: 'New York Stock Exchange', tz: 'America/New_York', open: [9, 30, 16, 0], hrs: '14:30 to 21:00 UK time', cur: '$', sd: 1.5, per: 'companies',
      idx: [['S&P 500', '^GSPC', 6702.1], ['Nasdaq Composite', '^IXIC', 22140.8], ['Dow Jones', '^DJI', 45880.4], ['Russell 2000', '^RUT', 2496.2], ['NYSE Composite', '^NYA', 20410.7]], cos: US, tags: ['us'] },
    europe: { k: 'europe', label: 'Europe', name: 'Europe', title: 'Europe', coin: '\u20ac', tone: '#5b8cff', ex: 'Deutsche B\u00f6rse Xetra', tz: 'Europe/Berlin', open: [9, 0, 17, 30], hrs: '08:00 to 16:30 UK time', cur: '\u20ac', sd: 1.2, per: 'companies',
      idx: [['Euro Stoxx 50', '^STOXX50E', 5540.3], ['DAX 40', '^GDAXI', 24210.6], ['CAC 40', '^FCHI', 7890.2], ['FTSE MIB', 'FTSEMIB.MI', 42180.9], ['IBEX 35', '^IBEX', 15120.4]], cos: EU, re: /\b(eurozone|euro area|ECB|Europe|European|German|Germany|France|French|Italy|Spain|DAX|Brussels|EU)\b/ },
    asia: { k: 'asia', label: 'Asia', name: 'Asia', title: 'Asia-Pacific', coin: '\u00a5', tone: '#ff6b8b', ex: 'Tokyo Stock Exchange', tz: 'Asia/Tokyo', open: [9, 0, 15, 30], hrs: '00:00 to 06:30 UK time', cur: '', sd: 1.4, per: 'companies',
      idx: [['Nikkei 225', '^N225', 43620.5], ['Hang Seng', '^HSI', 26340.2], ['Shanghai Composite', '000001.SS', 3850.7], ['Nifty 50', '^NSEI', 25120.3], ['KOSPI', '^KS11', 3390.6]], cos: AS, re: /\b(Asia|Asian|Japan|Japanese|Nikkei|China|Chinese|Hong Kong|India|Indian|Korea|Korean|yen|yuan|Taiwan)\b/ },
    crypto: { k: 'crypto', label: 'Crypto', name: 'Crypto', title: 'Crypto', coin: 'B', tone: '#ff9f1c', ex: 'Global markets', tz: 'Europe/London', open: null, hrs: 'Open 24 hours, every day', cur: '\u00a3', sd: 3.2, per: 'coins',
      idx: [['Bitcoin', 'bitcoin', 82340], ['Ethereum', 'ethereum', 2910], ['XRP', 'ripple', 1.95], ['BNB', 'binancecoin', 612], ['Solana', 'solana', 148]], cos: COINS, tags: ['crypto'] }
  };
  Object.keys(F.MK).forEach(function (k) {
    var m = F.MK[k];
    m.idx = m.idx.map(function (x) { return { name: x[0], sym: x[1], val: x[2], chg: 0, sp: null }; });
  });

  F.CN = { GBP: 'Pound sterling', USD: 'US dollar', EUR: 'Euro', JPY: 'Japanese yen', CHF: 'Swiss franc', AUD: 'Australian dollar', CAD: 'Canadian dollar', CNY: 'Chinese yuan', INR: 'Indian rupee', ETH: 'Ethereum', BNB: 'BNB', XRP: 'XRP', SOL: 'Solana', DOGE: 'Dogecoin' };
  F.CGID = { BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', XRP: 'ripple', SOL: 'solana', DOGE: 'dogecoin' };
  F.CONV = {
    uk: { base: 'GBP', lab: '\u00a31', amt: 1, to: ['USD', 'EUR', 'JPY', 'CHF', 'AUD'], title: 'Sterling, top 5 currencies', sub: 'What \u00a31 buys. ECB reference rates' },
    us: { base: 'USD', lab: '$1', amt: 1, to: ['GBP', 'EUR', 'JPY', 'CAD', 'CHF'], title: 'The dollar, top 5 conversions', sub: 'What $1 buys. ECB reference rates' },
    europe: { base: 'EUR', lab: '\u20ac1', amt: 1, to: ['GBP', 'USD', 'CHF', 'JPY', 'CNY'], title: 'The euro, top 5 conversions', sub: 'What \u20ac1 buys. ECB reference rates' },
    asia: { base: 'JPY', lab: '\u00a5100', amt: 100, to: ['USD', 'GBP', 'EUR', 'CNY', 'INR'], title: 'The yen, top 5 conversions', sub: 'What \u00a5100 buys. The yen is the most traded Asian currency' },
    crypto: { base: 'BTC', lab: '1 BTC', amt: 1, crypto: true, to: ['ETH', 'BNB', 'XRP', 'SOL', 'DOGE'], title: 'Bitcoin, in the other big five', sub: 'What 1 BTC is worth in each coin' }
  };
  /* used by the top strip and as a fallback when the rates feed is unreachable */
  F.DEMO_RATE = { GBP: 1, USD: 1.3442, EUR: 1.1531, JPY: 199.4, CHF: 1.0742, AUD: 2.02, CAD: 1.85, CNY: 9.61, INR: 115.3 };

  /* ---------- news: outlets read for headlines and trends ---------- */
  F.SOURCES = [
    { id: 'bbc-biz', name: 'BBC News', tags: ['uk', 'markets'], url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { id: 'bbc-eco', name: 'BBC News', tags: ['uk', 'economy'], url: 'https://feeds.bbci.co.uk/news/business/economy/rss.xml' },
    { id: 'gdn-biz', name: 'The Guardian', tags: ['uk', 'markets'], url: 'https://www.theguardian.com/uk/business/rss' },
    { id: 'sky', name: 'Sky News', tags: ['uk', 'markets'], url: 'https://feeds.skynews.com/feeds/rss/business.xml' },
    { id: 'ft-mkts', name: 'Financial Times', tags: ['markets'], url: 'https://www.ft.com/markets?format=rss' },
    { id: 'economist', name: 'The Economist', tags: ['economy'], url: 'https://www.economist.com/finance-and-economics/rss.xml' },
    { id: 'cnbc', name: 'CNBC', tags: ['us', 'markets'], url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html' },
    { id: 'boe', name: 'Bank of England', tags: ['uk', 'economy'], url: 'https://www.bankofengland.co.uk/rss/news' },
    { id: 'coindesk', name: 'CoinDesk', tags: ['crypto'], url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { id: 'cointelegraph', name: 'Cointelegraph', tags: ['crypto'], url: 'https://cointelegraph.com/rss' }
  ];

  F.CATS = { economy: ['Economy', '#f5a524'], markets: ['Markets', '#5b8cff'], business: ['Business', '#ff6b8b'], tech: ['Tech', '#a06bff'], world: ['World', '#ff8a4c'], energy: ['Energy', '#22c79a'], crypto: ['Crypto', '#b6d93a'] };

  /* id, label, category, pattern. A headline can match several topics. */
  F.TOPICS = [
    ['inflation', 'Inflation', 'economy', /inflation|\bCPI\b|consumer price|cost of living|price rises|shrinkflation/i],
    ['rates', 'Interest rates', 'economy', /interest rates?|rate cuts?|rate hikes?|base rate|borrowing costs?|mortgage rates?|rate decision|monetary policy/i],
    ['boe', 'Bank of England', 'economy', /Bank of England|\bBoE\b|Andrew Bailey|\bMPC\b/],
    ['fed', 'US Federal Reserve', 'economy', /Federal Reserve|\bFed\b|Powell|FOMC/],
    ['ecb', 'European Central Bank', 'economy', /\bECB\b|European Central Bank|Lagarde/],
    ['growth', 'Growth and recession', 'economy', /\bGDP\b|recession|economic growth|economy (shrank|grew|slows|slowdown|contract)|stagflation|downturn/i],
    ['jobs', 'Jobs and wages', 'economy', /unemployment|jobless|job cuts|redundanc|labour market|payrolls|\bwages?\b|pay (rise|growth|deal)|minimum wage|hiring|layoffs?/i],
    ['budget', 'Budget and tax', 'economy', /\bBudget\b|tax (rise|rises|cut|cuts|hike|hikes|bill|raid)|\bHMRC\b|spending review|Rachel Reeves|fiscal|national insurance|stamp duty|\bISAs?\b/i],
    ['housing', 'Housing', 'economy', /house prices?|home prices?|housing market|mortgages?|property market|estate agents?|landlords?|Nationwide|Halifax|first-time buyers?/i],
    ['bills', 'Energy bills', 'energy', /energy bills?|price cap|Ofgem|electricity prices?|gas prices?/i],
    ['stocks', 'Stocks and shares', 'markets', /\bstocks?\b|\bshares\b|equit(y|ies)|Wall Street|sell-?off|stock market|bull market|bear market/i],
    ['ftse', 'FTSE and London', 'markets', /FTSE|London Stock Exchange|London-listed|London market|blue-chip/i],
    ['us-indices', 'S&P 500 and Nasdaq', 'markets', /S&P 500|Nasdaq|Dow Jones|\bDow\b|Russell 2000/],
    ['bonds', 'Bonds and gilts', 'markets', /\bgilts?\b|bond yields?|bond market|Treasury yields?|Treasuries|10-year|30-year/i],
    ['oil', 'Oil', 'energy', /\boil\b|crude|Brent|OPEC|petrol|diesel|refiner/i],
    ['gold', 'Gold and metals', 'markets', /\bgold\b|silver|copper|bullion|precious metals?/i],
    ['fx', 'Sterling and currencies', 'markets', /sterling|the pound|\bGBP\b|currenc(y|ies)|forex|dollar index|the dollar|\byen\b|the euro\b/i],
    ['earnings', 'Earnings and dividends', 'markets', /earnings|\bprofits?\b|trading update|dividends?|quarterly|full-year|half-year|guidance/i],
    ['deals', 'Deals and takeovers', 'business', /takeover|acqui(re|res|red|sition)|merger|buyout|bid for|deal to buy|private equity|\bIPO\b|stock market listing|floats?\b/i],
    ['banks', 'Banks', 'business', /\bbanks\b|banking|HSBC|Barclays|Lloyds|NatWest|Santander|JPMorgan|Goldman|Morgan Stanley|lenders?\b/i],
    ['retail', 'Retail and shoppers', 'business', /retail|high street|supermarkets?|Tesco|Sainsbury|Asda|Morrisons|Marks (&|and) Spencer|\bM&S\b|Primark|consumer (spending|confidence)|shoppers?/i],
    ['travel', 'Travel and airlines', 'business', /airlines?|flights?|airports?|easyJet|Ryanair|Heathrow|Gatwick|British Airways|tourism/i],
    ['cars', 'Cars and EVs', 'business', /carmakers?|car makers?|automak|electric (vehicles?|cars?)|\bEVs?\b|Tesla|Jaguar Land Rover|\bJLR\b|Nissan|BYD/i],
    ['health', 'Health and pharma', 'business', /pharma|drugmakers?|\bNHS\b|Novo Nordisk|AstraZeneca|Pfizer|weight[- ]loss|GLP-1|Ozempic|Wegovy|biotech/i],
    ['ai', 'AI and chips', 'tech', /\bAI\b|artificial intelligence|OpenAI|ChatGPT|Anthropic|Nvidia|semiconductors?|\bchips?\b|data cent(re|er)s?/i],
    ['bigtech', 'Big Tech', 'tech', /Apple|Microsoft|Alphabet|Google|Amazon|\bMeta\b|Big Tech|Samsung|Netflix/],
    ['trump', 'Donald Trump', 'world', /Trump/],
    ['tariffs', 'Tariffs and trade', 'world', /tariffs?|trade war|trade deal|trade tensions|export controls|import dut/i],
    ['china', 'China', 'world', /China|Chinese|Beijing|Xi Jinping|\byuan\b/],
    ['mideast', 'Iran and the Middle East', 'world', /\bIran|Israel|Gaza|Middle East|Hormuz|Houthi|Tehran/],
    ['ukraine', 'Ukraine and Russia', 'world', /Ukrain|Russia|Putin|Kyiv|Moscow/],
    ['eu', 'Europe and the EU', 'world', /\bEU\b|European Union|Brussels|eurozone|euro area/],
    ['ukpol', 'UK politics', 'world', /Starmer|\bLabour\b|Tories|Conservatives?\b|Reform UK|Westminster|Downing Street|\bMPs?\b|Farage|Badenoch/],
    ['uspol', 'US politics', 'world', /White House|Congress|Senate|Republicans?\b|Democrats?\b/],
    ['climate', 'Energy and climate', 'energy', /renewables?|wind (farm|power)|\bsolar\b|nuclear|North Sea|net zero|climate|carbon|hydrogen|windfall/i],
    ['bitcoin', 'Bitcoin', 'crypto', /bitcoin|\bBTC\b/i],
    ['alts', 'Ethereum and altcoins', 'crypto', /ethereum|\bETH\b|solana|\bXRP\b|altcoins?|dogecoin/i],
    ['cryptorules', 'Crypto rules and ETFs', 'crypto', /stablecoins?|crypto (regulation|rules|bill|market)|\bSEC\b|spot ETF|Coinbase|Binance/i]
  ].map(function (r) { return { id: r[0], label: r[1], cat: r[2], re: r[3] }; });

  /* headlines shown only when no live feed can be reached, clearly marked as samples */
  F.SAMPLE_NEWS = [
    { src: 'BBC News', title: 'Bank of England keeps a close eye on inflation as the pound steadies', url: 'https://www.bbc.co.uk/news/business', tags: ['uk'] },
    { src: 'Financial Times', title: 'London-listed banks lead the index as investors weigh the outlook for rates', url: 'https://www.ft.com/markets', tags: ['uk'] },
    { src: 'The Guardian', title: 'What lower borrowing costs could mean for households this autumn', url: 'https://www.theguardian.com/uk/business', tags: ['uk'] },
    { src: 'CNBC', title: 'Wall Street steadies as traders look ahead to the next Federal Reserve meeting', url: 'https://www.cnbc.com/markets/', tags: ['us'] }
  ];
})();
