#!/usr/bin/env python3
# Apply the agreed MMFR design tidy-up.
#
# Run from the root of the FAHDUK/MMFR repository:
#     python apply_mmfr_design_tweaks.py
#
# The script stops rather than guessing if the source has changed too much.

from pathlib import Path

ROOT = Path.cwd()

def read(rel):
    p = ROOT / rel
    if not p.exists():
        raise SystemExit(f"Missing {rel}. Run this script from the MMFR repo root.")
    return p.read_text(encoding="utf-8")

def write(rel, text):
    (ROOT / rel).write_text(text, encoding="utf-8")

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}. No change written for this step.")
    return text.replace(old, new, 1)

def replace_between(text, start_marker, end_marker, replacement, label):
    a = text.find(start_marker)
    b = text.find(end_marker, a + len(start_marker)) if a >= 0 else -1
    if a < 0 or b < 0:
        raise SystemExit(f"{label}: could not find the expected source markers.")
    return text[:a] + replacement + text[b:]


# ---------------------------------------------------------------------------
# index.html
# ---------------------------------------------------------------------------
index = read("index.html")

old_desc = "A playful live market tracker for the UK: UK, US, European and Asian markets, crypto in pounds, and a web of what the news is talking about."
new_desc = "A playful live market tracker for the UK: UK, US, European and Asian markets, crypto in pounds, and a ranked view of what the news is talking about."
index = index.replace(old_desc, new_desc)

index = replace_once(
    index,
    '        <img class="hero__fish" src="assets/betta-a.webp" width="1500" height="1552" alt="A red and blue betta fish drifting in dark water" fetchpriority="high">',
    '        <div class="hero__fish" id="heroFish" role="img" aria-label="A cartoon red and blue betta fish drifting through the market"></div>',
    "index hero fish",
)

index = replace_once(
    index,
    '<div class="sec__head reveal"><h2 class="h2">What is everyone saying?</h2><a class="btn" href="trends.html">Open the full web</a></div>',
    '<div class="sec__head reveal"><h2 class="h2">What is everyone saying?</h2><a class="btn" href="trends.html">See the trend board</a></div>',
    "index trends CTA",
)

index = replace_once(
    index,
    '<div class="panel webbox webbox--mini" id="miniWeb"><p class="empty">Fishing for headlines...</p></div>',
    '<div class="panel trendbars" id="trendBars"><p class="empty">Fishing for headlines...</p></div>',
    "index mini trend visual",
)

write("index.html", index)


# ---------------------------------------------------------------------------
# trends.html
# ---------------------------------------------------------------------------
trends_html = read("trends.html")
trends_html = trends_html.replace(
    "A living web of what BBC, Guardian, FT, Reuters, CNBC and the Bank of England are talking about.",
    "A ranked view of what BBC, Guardian, FT, Reuters, CNBC and the Bank of England are talking about.",
)
write("trends.html", trends_html)


# ---------------------------------------------------------------------------
# js/ui.js — add a cartoon home betta mascot to match the rest of the site
# ---------------------------------------------------------------------------
ui = read("js/ui.js")

home_mascot = r'''  var MASCOTS = {
    /* Home: a flowing red-and-blue betta, drawn in the same sticker style as the pond mascots */
    home: function () {
      return svg(
        shape('path', 'd="M68 112 C48 78 24 60 10 72 C24 94 24 130 10 150 C26 160 50 144 70 120 Z"', '#3d78ff') +
        shape('path', 'd="M78 88 C66 58 92 34 126 48 C112 66 102 80 98 94 Z"', '#6d8dff') +
        shape('path', 'd="M80 138 C70 170 106 194 144 170 C124 158 110 146 100 132 Z"', '#315ed0') +
        shape('ellipse', 'cx="120" cy="112" rx="66" ry="44"', '#ff6b81') +
        '<path d="M78 84 C90 100 94 126 82 144" fill="none" stroke="#3d78ff" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M96 74 C108 94 112 130 100 150" fill="none" stroke="#5f80ff" stroke-width="8" stroke-linecap="round" opacity=".95"/>' +
        '<ellipse cx="124" cy="137" rx="38" ry="14" fill="#ff9caf" opacity=".55"/>' +
        eye(148, 101, 13, 3) +
        '<circle cx="140" cy="122" r="6" fill="#ffb3bf" opacity=".85"/>' +
        '<path d="M154 126 Q166 132 176 124" fill="none" stroke="#7a2338" stroke-width="4" stroke-linecap="round"/>' +
        '<g fill="' + CREAM + '" opacity=".62"><circle cx="108" cy="98" r="3.5"/><circle cx="118" cy="88" r="3"/><circle cx="124" cy="108" r="3.5"/><circle cx="106" cy="122" r="3"/></g>'
      );
    },
    /* UK: a plump red fish in a bowler hat, with a moustache and a brolly */'''

ui = replace_once(
    ui,
    "  var MASCOTS = {\n    /* UK: a plump red fish in a bowler hat, with a moustache and a brolly */",
    home_mascot,
    "home mascot insertion",
)

write("js/ui.js", ui)


# ---------------------------------------------------------------------------
# js/page.js — remove the trend web from the visible UI and use ranked cards/bars
# ---------------------------------------------------------------------------
page = read("js/page.js")

new_render_trends = r'''function renderTrends() {
    document.title = 'FRMM | What is trending';
    main.innerHTML =
      '<section class="phero"><div class="wrap phero__grid">' +
      '<div class="phero__copy"><p class="sticker">Pond 06 &middot; Trends</p>' +
      '<h1 class="phero__title">What everyone is saying<svg class="squig" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8c12-9 20 9 32 0s20 9 32 0 20 9 32 0 20 9 32 0 20 9 32 0 20 9 34 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></h1>' +
      '<p class="phero__lede">A ranked view of the money, economy and world stories in the news over the last day and a half. Longer bars mean a topic is appearing in more coverage. Only reputable outlets and official bodies feed it.</p>' +
      '<p class="trendstat" id="trendStat">Fishing for headlines...</p></div>' +
      '<div class="phero__art"><div class="phero__blob" aria-hidden="true"></div>' + seal('WHAT EVERYONE IS SAYING', page) + '<div class="mascot">' + F.mascot('trends') + '</div>' +
      '<div class="bubble"><b id="bubbleMood">Something is glowing</b><span id="bubbleLine">Tap a trend card to read the stories.</span></div></div></div></section>' +

      '<section class="sec" id="trends"><div class="wrap">' +
      '<div class="tools reveal"><div class="legend" id="legend" role="group" aria-label="Filter by category"></div></div>' +
      '<div class="trendgridwrap reveal"><div class="gridbox" id="gridBox"></div><aside class="detail panel" id="detail" aria-live="polite"><p class="detail__hint">Tap a trend card to see the stories behind it, each linking to the outlet that ran it.</p></aside></div></div></section>' +

      '<section class="sec sec--last" id="sources"><div class="wrap"><div class="sec__head reveal"><h2 class="h2">Who is talking</h2><p class="sub">Outlets behind the current picture</p></div><div class="srcs reveal" id="srcList"></div>' +
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
          $('bubbleMood').textContent = data.nodes[0].label + ' is glowing';
          $('bubbleLine').textContent = data.nodes[0].mentions + ' stories from ' + data.nodes[0].sources + ' outlets.';
        }
        $('srcList').innerHTML = data.sources.map(function (s) { return '<span class="src' + (s.type === 'official' ? ' src--off' : '') + '"><b>' + esc(s.name) + '</b><em>' + s.n + ' headlines' + (s.type === 'official' ? ' &middot; Official' : '') + '</em></span>'; }).join('');
        draw();
      }, 250);
    };
    F.on('feeds', update);
    F.reveal();
    F.startFeeds();
    F.watch(F.TICK_SYMS);
  }

  '''

page = replace_between(
    page,
    "function renderTrends() {",
    "/* ---------- home ---------- */",
    new_render_trends,
    "renderTrends replacement",
)

page = replace_once(
    page,
    "  function renderHome() {\n    var ponds = [",
    "  function renderHome() {\n    var heroFish = $('heroFish');\n    if (heroFish) heroFish.innerHTML = F.mascot('home');\n\n    var ponds = [",
    "home fish render",
)

page = replace_once(
    page,
    "{ k: 'trends', blurb: 'A living web of what everyone is talking about.', label: 'Hot right now' }",
    "{ k: 'trends', blurb: 'A ranked pulse of what everyone is talking about.', label: 'Hot right now' }",
    "home trends blurb",
)

start = "    var webT = null, webDone = false;\n    var paintTrends = function () {"
end = "    F.on('feeds', paintNews); F.on('feeds', paintTrends); paintNews();"
a = page.find(start)
b = page.find(end, a)
if a < 0 or b < 0:
    raise SystemExit("home trend renderer: could not find expected markers.")

new_home_trends = r'''    var trendT = null;
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
          box.innerHTML = '<h3>Most mentioned topics</h3><ol class="trendbars__list">' +
            data.nodes.slice(0, 6).map(function (n, i) {
              var w = Math.max(10, Math.round(n.mentions / top * 100));
              return '<li class="trendbar" style="--c:' + F.CATS[n.cat].color + '">' +
                '<span class="trendbar__rank">' + (i + 1) + '</span>' +
                '<span class="trendbar__label"><b>' + esc(n.label) + '</b><em>' + n.mentions + ' stories</em></span>' +
                '<span class="trendbar__track" aria-hidden="true"><i style="width:' + w + '%"></i></span></li>';
            }).join('') + '</ol>';
        }

        $('topList').innerHTML = data.nodes.slice(0, 5).map(function (n, i) {
          return '<li><span class="rk">' + (i + 1) + '</span><b>' + esc(n.label) + '</b><em>' + n.mentions + ' stories</em></li>';
        }).join('');
      }, 300);
    };
'''
page = page[:a] + new_home_trends + page[b:]

write("js/page.js", page)


# ---------------------------------------------------------------------------
# css/styles.css — straighten the cards/boxes and style the new trend views
# ---------------------------------------------------------------------------
css = read("css/styles.css")

replacements = [
    ('.nav__a:hover { background: rgba(255, 255, 255, .1); transform: rotate(-2.5deg) translateY(-1px); }',
     '.nav__a:hover { background: rgba(255, 255, 255, .1); transform: translateY(-1px); }',
     "nav hover"),
    ("  font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; transform: rotate(-2.5deg); box-shadow: 3px 3px 0 rgba(2, 8, 30, .4);",
     "  font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; box-shadow: 3px 3px 0 rgba(2, 8, 30, .4);",
     "sticker straightening"),
    ('.btn:hover { transform: rotate(-2deg) translateY(-2px); background: rgba(255, 244, 222, .12); }',
     '.btn:hover { transform: translateY(-2px); background: rgba(255, 244, 222, .12); }',
     "button hover"),
    ('.bubble { position: absolute; left: -3%; bottom: 2%; max-width: 76%; padding: 13px 18px; border-radius: 22px; background: var(--cream); color: var(--ink); transform: rotate(-2.5deg); box-shadow: var(--pop); z-index: 3; display: flex; flex-direction: column; gap: 3px; }',
     '.bubble { position: absolute; left: -3%; bottom: 2%; max-width: 76%; padding: 13px 18px; border-radius: 22px; background: var(--cream); color: var(--ink); box-shadow: var(--pop); z-index: 3; display: flex; flex-direction: column; gap: 3px; }',
     "speech bubble"),
    ('.tile:nth-child(odd) { transform: rotate(-.7deg); } .tile:nth-child(even) { transform: rotate(.6deg); }',
     '.tile:nth-child(odd), .tile:nth-child(even) { transform: none; }',
     "market tiles"),
    ('.tile:hover { transform: rotate(0) translateY(-4px); }',
     '.tile:hover { transform: translateY(-4px); }',
     "market tile hover"),
    ('.card:hover { transform: rotate(var(--tilt, 0deg)) translateY(-5px); background: rgba(255, 255, 255, .09); }',
     '.card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, .09); }',
     "news cards"),
    ('.coin:nth-child(odd) { transform: rotate(-.5deg); } .coin:nth-child(even) { transform: rotate(.5deg); }',
     '.coin:nth-child(odd), .coin:nth-child(even) { transform: none; }',
     "coin cards"),
    ('.coin:hover { transform: rotate(0) translateY(-4px); }',
     '.coin:hover { transform: translateY(-4px); }',
     "coin hover"),
    ('.lg:hover { transform: rotate(-2deg) translateY(-1px); }',
     '.lg:hover { transform: translateY(-1px); }',
     "trend filter hover"),
    ('.chips .chip:hover { transform: rotate(-2deg) translateY(-1px); }',
     '.chips .chip:hover { transform: translateY(-1px); }',
     "topic chip hover"),
    ('.hot { height: 100%; position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 20px 20px 18px; border-radius: 24px; text-align: left; background: color-mix(in srgb, var(--c) 10%, rgba(255, 255, 255, .04)); border: 2px solid color-mix(in srgb, var(--c) 70%, transparent); box-shadow: var(--pop); transform: rotate(var(--tilt, 0deg)); transition: transform .3s cubic-bezier(.3, 1.6, .5, 1); }',
     '.hot { height: 100%; position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 20px 20px 18px; border-radius: 24px; text-align: left; background: color-mix(in srgb, var(--c) 10%, rgba(255, 255, 255, .04)); border: 2px solid color-mix(in srgb, var(--c) 70%, transparent); box-shadow: var(--pop); transition: transform .3s cubic-bezier(.3, 1.6, .5, 1); }',
     "trend cards"),
    ('.hot:hover { transform: rotate(0) translateY(-4px); }',
     '.hot:hover { transform: translateY(-4px); }',
     "trend card hover"),
    ('.stk--a { left: -2%; top: 18%; transform: rotate(-4deg); }',
     '.stk--a { left: -2%; top: 18%; }',
     "hero quote A"),
    ('.stk--b { right: -3%; top: 40%; transform: rotate(3deg); }',
     '.stk--b { right: -3%; top: 40%; }',
     "hero quote B"),
    ('.stk--c { left: 2%; bottom: 14%; transform: rotate(2.5deg); }',
     '.stk--c { left: 2%; bottom: 14%; }',
     "hero quote C"),
    ('.stk--d { right: 4%; bottom: 4%; transform: rotate(-3deg); }',
     '.stk--d { right: 4%; bottom: 4%; }',
     "hero quote D"),
    ('.pond:nth-child(3n + 1) { transform: rotate(-.8deg); } .pond:nth-child(3n + 2) { transform: rotate(.5deg); } .pond:nth-child(3n) { transform: rotate(-.4deg); }',
     '.pond:nth-child(3n + 1), .pond:nth-child(3n + 2), .pond:nth-child(3n) { transform: none; }',
     "pond cards"),
    ('.pond.is-in:hover, .pond:hover { transform: rotate(0) translateY(-6px); box-shadow: 8px 10px 0 rgba(2, 8, 30, .38); }',
     '.pond.is-in:hover, .pond:hover { transform: translateY(-6px); box-shadow: 8px 10px 0 rgba(2, 8, 30, .38); }',
     "pond hover"),
]
for old, new, label in replacements:
    css = replace_once(css, old, new, label)

css = replace_once(
    css,
    '.hero__fish { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 30px 40px rgba(3, 10, 44, .55)) drop-shadow(0 0 40px rgba(255, 90, 130, .25)); animation: drift 9s ease-in-out infinite; }',
    '.hero__fish { position: absolute; inset: 0; width: 100%; height: 100%; filter: drop-shadow(0 30px 40px rgba(3, 10, 44, .55)) drop-shadow(0 0 40px rgba(255, 90, 130, .25)); animation: drift 9s ease-in-out infinite; }\n.hero__fish svg { width: 100%; height: 100%; overflow: visible; }',
    "hero fish SVG styling",
)

css = replace_once(
    css,
    '.wavesgrid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 22px; align-items: stretch; }',
    '''.wavesgrid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 22px; align-items: stretch; }
.trendbars { padding: 24px 26px 20px; }
.trendbars h3 { font-family: var(--serif); font-variation-settings: 'SOFT' 100, 'WONK' 1; font-size: 26px; font-weight: 700; margin-bottom: 12px; }
.trendbars__list { display: flex; flex-direction: column; gap: 8px; }
.trendbar { display: grid; grid-template-columns: 30px minmax(120px, .9fr) minmax(120px, 1.5fr); gap: 12px; align-items: center; padding: 10px 0; border-top: 1px dashed rgba(255, 255, 255, .16); }
.trendbar:first-child { border-top: 0; }
.trendbar__rank { font-family: var(--serif); font-size: 22px; font-weight: 700; color: var(--c); }
.trendbar__label { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.trendbar__label b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
.trendbar__label em { font-style: normal; font-size: 11px; color: var(--faint); }
.trendbar__track { height: 9px; border-radius: 999px; overflow: hidden; background: rgba(255, 255, 255, .1); }
.trendbar__track i { display: block; height: 100%; border-radius: inherit; background: var(--c); }
.trendgridwrap { display: grid; grid-template-columns: minmax(0, 1fr) 350px; gap: 22px; align-items: start; }
.trendgridwrap .gridbox { grid-template-columns: repeat(2, minmax(0, 1fr)); }''',
    "trend layout CSS",
)

css = replace_once(
    css,
    '  .webwrap, .wavesgrid, .mvgrid { grid-template-columns: 1fr; }',
    '  .webwrap, .trendgridwrap, .wavesgrid, .mvgrid { grid-template-columns: 1fr; }\n  .trendgridwrap .gridbox { grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }',
    "responsive trend layout",
)

css = replace_once(
    css,
    '  .pondgrid { grid-template-columns: 1fr; }',
    '  .pondgrid { grid-template-columns: 1fr; }\n  .trendgridwrap .gridbox { grid-template-columns: 1fr; }\n  .trendbar { grid-template-columns: 26px minmax(0, 1fr); }\n  .trendbar__track { grid-column: 2; width: 100%; }',
    "mobile trend layout",
)

write("css/styles.css", css)

print("MMFR design tweaks applied successfully.")
print("Review with: git diff")
print('Suggested commit: git commit -am "Tidy cards, cartoon hero fish and simplify trends"')
