/* FRMM ocean: glowing specks, depth rail, section tracking, soft scroll reveals */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------- glowing specks (CSS-animated, spread over the full page) ---------- */
  var specks = $('specks'), speckH = 0;
  function buildSpecks() {
    specks.style.height = '0px';
    var h = Math.max(doc.scrollHeight, window.innerHeight);
    if (Math.abs(h - speckH) < 200 && specks.children.length) { specks.style.height = speckH + 'px'; return; }
    speckH = h;
    specks.style.height = h + 'px';
    var n = Math.min(520, Math.round((h / 1000) * (window.innerWidth < 720 ? 34 : 66)));
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      var core = [0.9, 1.1, 1.3, 1.6, 1.9, 2.3][Math.floor(Math.random() * 6)];
      var d = rnd(3.6, 8.2);
      s.className = 'speck';
      s.style.left = rnd(0.5, 99.5).toFixed(2) + '%';
      s.style.top = Math.round(rnd(6, h - 6)) + 'px';
      s.style.setProperty('--r', (core * rnd(6, 9)).toFixed(1) + 'px');
      s.style.setProperty('--d', d.toFixed(1) + 's');
      s.style.setProperty('--dl', '-' + rnd(0, d).toFixed(1) + 's');
      s.style.setProperty('--lo', rnd(0.1, 0.24).toFixed(2));
      s.style.setProperty('--hi', rnd(0.5, 0.85).toFixed(2));
      frag.appendChild(s);
    }
    specks.textContent = '';
    specks.appendChild(frag);
  }

  /* ---------- scroll: header, depth rail ---------- */
  var hero = document.querySelector('.hero');
  var top = $('top'), thumb = $('depthThumb'), depthValue = $('depthValue');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, y / max));
    if (top) top.classList.toggle('is-scrolled', y > 40);
    if (depthValue) depthValue.textContent = Math.round(p * 200);
    if (thumb) {
      var track = thumb.parentNode.clientHeight || 380;
      thumb.style.top = Math.round(p * (track - thumb.offsetHeight)) + 'px';
    }
    if (hero) hero.style.setProperty('--hp', Math.min(1, y / (window.innerHeight * 0.9)).toFixed(3));
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- which section is in view: nav underline + left rail ---------- */
  var railLeft = $('railLeft'), railText = $('railLeftText');
  var navLinks = document.querySelectorAll('[data-nav]');
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-section]'));
  function setSection(sec) {
    var id = sec ? sec.getAttribute('data-section') : '';
    Array.prototype.forEach.call(navLinks, function (a) { a.classList.toggle('is-active', a.getAttribute('data-nav') === id); });
    if (railLeft) {
      railText.textContent = sec ? sec.getAttribute('data-next') : 'DIVE IN';
      railLeft.setAttribute('href', sec ? sec.getAttribute('data-target') : '#markets');
    }
  }
  function findSection() {
    var mid = window.scrollY + window.innerHeight * 0.4, cur = null;
    sections.forEach(function (s) { if (s.offsetTop <= mid) cur = s; });
    setSection(cur);
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(findSection); }, { passive: true });

  /* ---------- reveal on scroll ---------- */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    // content added later (news feature) is picked up here
    window.FRMM_reveal = function (el) { if (el && !el.classList.contains('is-in')) io.observe(el); };
  } else {
    Array.prototype.forEach.call(els, function (el) { el.classList.add('is-in'); });
    window.FRMM_reveal = function (el) { if (el) el.classList.add('is-in'); };
  }

  /* ---------- init ---------- */
  window.addEventListener('load', function () { buildSpecks(); onScroll(); findSection(); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildSpecks, 400); });
  // page height grows as data loads, so refresh the speck field a couple of times
  setTimeout(buildSpecks, 3000); setTimeout(buildSpecks, 9000);
  buildSpecks(); onScroll(); findSection();
})();
