/* FRMM ocean: glowing specks, rising bubbles, depth rail, section tracking, reveals */
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

  /* ---------- rising bubbles ---------- */
  var cv = $('bubbles');
  var scrollDelta = 0, lastY = window.scrollY;
  if (cv && !reduce) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, bubbles = [], mouse = { x: -999, y: -999 };
    var size = function () {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(38, Math.max(14, W / 38)));
      while (bubbles.length < n) bubbles.push(spawn(true));
      bubbles.length = n;
    };
    var spawn = function (anywhere) {
      var r = Math.pow(Math.random(), 2.2) * 9 + 1.8;
      // keep most bubbles toward the edges so they drift past the content, not through it
      var edge = Math.random() < 0.7;
      var x = edge ? (Math.random() < 0.5 ? rnd(0, W * 0.09) : rnd(W * 0.91, W)) : Math.random() * W;
      return { x: x, y: anywhere ? Math.random() * H : H + 20 + Math.random() * 80, r: r, vy: 12 + r * 4 + Math.random() * 10, ph: Math.random() * 6.28, sp: .4 + Math.random() * .8, amp: 5 + Math.random() * 12 };
    };
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('resize', size);
    size();
    var last = performance.now();
    var frame = function (t) {
      var dt = Math.min(.05, (t - last) / 1000); last = t;
      var sd = scrollDelta; scrollDelta = 0;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        b.y -= b.vy * dt + sd * (0.12 + b.r * 0.025);
        b.ph += b.sp * dt;
        var x = b.x + Math.sin(b.ph) * b.amp;
        var dx = x - mouse.x, dy = b.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000) b.x += (dx / Math.sqrt(d2 + 1)) * 40 * dt;
        if (b.y < -20) { bubbles[i] = spawn(false); continue; }
        if (b.y > H + 120) b.y = -10;
        ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.283);
        ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke();
        if (b.r > 4) {
          ctx.beginPath(); ctx.arc(x - b.r * .35, b.y - b.r * .35, Math.max(.8, b.r * .2), 0, 6.283);
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- scroll: header, depth rail ---------- */
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
    scrollDelta += y - lastY; lastY = y;
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
