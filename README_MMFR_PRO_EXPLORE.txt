MMFR PRO / EXPLORE REDESIGN
===========================

This package adds one persistent switch with two complete presentation modes:

- Pro (the default): photorealistic fish, restrained professional styling,
  precise terminology and the complete data tables.
- Explore: the original cartoon creatures, plain-English explanations,
  translated finance terms and fewer rows/cards at once.

Both views use the same market and news data. The choice is remembered across
every page. Live, last-close, connecting and demonstration prices are labelled
clearly, with an additional plain-English explanation.

HOW TO INSTALL IT IN YOUR GITHUB CODESPACE
-------------------------------------------

1. Download install_mmfr_pro_explore.py.
2. Upload it to the top MMFR folder, beside index.html.
3. In the Codespace terminal run:

   python install_mmfr_pro_explore.py

4. The installer creates a dated backup ZIP outside the repository, then
   replaces the required website files and adds assets/pro/.
5. Review the result:

   git diff --stat
   git diff

6. Press q to leave the diff screen. Then commit only the website files:

   git add README.md *.html css/styles.css js/core.js js/data.js js/markets.js js/page.js js/ui.js assets/pro/
   git commit -m "Add Pro and Explore views"
   git push

Do not use "git add ." because that would also add the installer to the repo.

After GitHub Pages rebuilds, refresh the website. The Pro / Explore switch is
in the top-right header and also appears inside the mobile menu.
