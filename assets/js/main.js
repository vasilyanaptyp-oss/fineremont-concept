/* Файний Ремонт v2 — animations. GSAP + ScrollTrigger (CDN). Degrades to static if GSAP is missing. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (rm || !hasGsap) doc.classList.add('rm');

  /* ---------- Header + mobile menu ---------- */
  var hdr = document.getElementById('hdr');
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  var lockY = 0;
  function onScrollHdr() { hdr.classList.toggle('is-scrolled', window.scrollY > 24 || !mnav.hidden); }
  window.addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();
  function openMenu() {
    lockY = window.scrollY;
    burger.setAttribute('aria-expanded', 'true'); mnav.hidden = false; hdr.classList.add('is-scrolled');
    document.body.style.cssText = 'position:fixed;top:-' + lockY + 'px;left:0;right:0;overflow:hidden';
  }
  function closeMenu() {
    if (mnav.hidden) return;
    burger.setAttribute('aria-expanded', 'false'); mnav.hidden = true;
    document.body.style.cssText = ''; window.scrollTo(0, lockY); onScrollHdr();
  }
  burger.addEventListener('click', function () { mnav.hidden ? openMenu() : closeMenu(); });
  mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) closeMenu(); });

  /* ---------- Mobile bottom bar: hidden over hero, order form and footer ---------- */
  var bar = document.getElementById('bar');
  if (bar && 'IntersectionObserver' in window) {
    var seen = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); });
      bar.classList.toggle('is-hidden', seen.size > 0);
    }, { threshold: 0.05 });
    document.querySelectorAll('.hero, .ord, .ftr').forEach(function (el) { io.observe(el); });
  }

  if (doc.classList.contains('rm')) return;   // static page from here on

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var mm = gsap.matchMedia();

  /* ---------- Header theme over the light chapter ---------- */
  ScrollTrigger.create({ trigger: '#chapter', start: 'top 60px', end: 'bottom 60px', toggleClass: { targets: '#hdr', className: 'hdr--light' } });

  /* ---------- HERO ---------- */
  // The entrance (headline words, sub, cards flying in) is a CSS animation — see style.css.
  // GSAP only owns the scroll-driven part, so its start values never depend on intro timing.
  var cards = { b: document.querySelector('.c3--b'), main: document.querySelector('.c3--main'), c: document.querySelector('.c3--c') };
  var stageInner = document.getElementById('stageInner');

  // resting fan (mirrors the CSS fallback); GSAP owns transforms from here.
  // Offsets are in px of the card width (a "%" on x would be re-mapped to xPercent by GSAP).
  var cw = function () { return cards.main.offsetWidth || 400; };
  var ch = function () { return cards.main.offsetHeight || 300; };
  // function-based values: re-evaluated by gsap.set and on invalidateOnRefresh
  var RESTV = {
    b:    { xPercent: -50, yPercent: -50, x: function () { return -0.38 * cw(); }, y: function () { return -0.10 * ch(); }, z: -160, rotateY: 18,  opacity: .9 },
    main: { xPercent: -50, yPercent: -50, x: 0, y: 0, z: 40, rotateY: 0, opacity: 1 },
    c:    { xPercent: -50, yPercent: -50, x: function () { return 0.38 * cw(); },  y: function () { return 0.12 * ch(); },  z: -160, rotateY: -18, opacity: .9 }
  };
  function rest() { Object.keys(RESTV).forEach(function (k) { gsap.set(cards[k], RESTV[k]); }); }
  // mouse-parallax setters, created once outside any matchMedia context (a context would try to revert them)
  var qx = gsap.quickTo(stageInner, 'rotateY', { duration: 1, ease: 'power3.out' });
  var qy = gsap.quickTo(stageInner, 'rotateX', { duration: 1, ease: 'power3.out' });

  mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)' }, function (ctx) {
    if (!ctx.conditions.desk) return;            // phones: single static photo, nothing to animate
    rest();
    // mouse parallax (quickTo tweens live outside the context, see below)
    var onMove = function (e) {
      if (e.pointerType === 'touch') return;
      qx((e.clientX / window.innerWidth - 0.5) * 10); qy(-(e.clientY / window.innerHeight - 0.5) * 6);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // scroll: short pin, fan opens and drifts up, copy leaves in the last 45%
    // explicit start values (the resting fan) so the timeline is correct whenever ScrollTrigger initialises it
    var tl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=70%', pin: '.hero__pin', scrub: 0.6, invalidateOnRefresh: true } });
    tl.fromTo(cards.b,    RESTV.b,    { x: function () { return -0.56 * cw(); }, y: function () { return -0.30 * ch(); }, z: -60, rotateY: 30,  duration: 1, immediateRender: false, ease: 'none' }, 0)
      .fromTo(cards.c,    RESTV.c,    { x: function () { return 0.56 * cw(); },  y: function () { return 0.32 * ch(); },  z: -60, rotateY: -30, duration: 1, immediateRender: false, ease: 'none' }, 0)
      .fromTo(cards.main, RESTV.main, { y: function () { return -0.16 * ch(); }, z: 120, duration: 1, immediateRender: false, ease: 'none' }, 0)
      .to('.hero__copy', { y: -80, opacity: 0, duration: .45, ease: 'power1.in' }, 0.55);
    return function () { window.removeEventListener('pointermove', onMove); };
  });

  /* ---------- Process: stacked cards ---------- */
  var steps = gsap.utils.toArray('.step');
  steps.forEach(function (s, i) {
    if (i === steps.length - 1) return;
    gsap.to(s, { scale: 0.94 - (steps.length - 2 - i) * 0.02, '--dim': 0.45, ease: 'none',
      scrollTrigger: { trigger: steps[i + 1], start: 'top 85%', end: 'top 25%', scrub: true } });
  });

  /* ---------- 3D ring gallery (desktop only; phones get a CSS strip) ---------- */
  mm.add('(min-width: 900px)', function () {
    var ring = document.getElementById('ring');
    var ringWrap = document.getElementById('ringWrap');
    var figs = gsap.utils.toArray('#ring figure');
    var N = figs.length, step = 360 / N, R = 0;
    var state = { rot: 0, drag: 0 };
    function placeRing() {
      var w = figs[0].offsetWidth || 380;
      R = Math.round((w / 2) / Math.tan(Math.PI / N) * 1.1);
      figs.forEach(function (f, i) { f.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R + 'px)'; });
      renderRing();
    }
    function renderRing() {
      var a = state.rot + state.drag;
      ring.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + a + 'deg)';
      figs.forEach(function (f, i) {
        var ang = ((i * step + a) % 360 + 360) % 360;
        var d = Math.abs(ang > 180 ? ang - 360 : ang) / 180;      // 0 front … 1 back
        f.style.setProperty('--dim', d > 0.5 ? 1 : (d * 2).toFixed(3));
      });
    }
    placeRing();
    var lastW = window.innerWidth;
    var onResize = function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; placeRing(); } };
    window.addEventListener('resize', onResize);

    var spin = gsap.fromTo(state, { rot: 0 }, { rot: -180, ease: 'none',
      scrollTrigger: { trigger: '.gal', start: 'top top', end: '+=100%', pin: '.gal__pin', scrub: 0.8, onUpdate: renderRing, invalidateOnRefresh: true } });

    // drag: left button only, rAF-throttled, snaps to the nearest work on release
    var px = 0, dragging = false, startDrag = 0, raf = 0;
    var down = function (e) { if (e.button !== 0) return; dragging = true; px = e.clientX; startDrag = state.drag; ringWrap.classList.add('is-drag'); ringWrap.setPointerCapture(e.pointerId); };
    var move = function (e) { if (!dragging) return; state.drag = startDrag + (e.clientX - px) * 0.35; if (!raf) raf = requestAnimationFrame(function () { raf = 0; renderRing(); }); };
    var up = function () {
      if (!dragging) return; dragging = false; ringWrap.classList.remove('is-drag');
      var total = state.rot + state.drag, snapped = Math.round(total / step) * step;
      gsap.to(state, { drag: snapped - state.rot, duration: .5, ease: 'power2.out', onUpdate: renderRing });
    };
    ringWrap.addEventListener('pointerdown', down); ringWrap.addEventListener('pointermove', move);
    ringWrap.addEventListener('pointerup', up); ringWrap.addEventListener('pointercancel', up);
    return function () {
      window.removeEventListener('resize', onResize);
      ringWrap.removeEventListener('pointerdown', down); ringWrap.removeEventListener('pointermove', move);
      ringWrap.removeEventListener('pointerup', up); ringWrap.removeEventListener('pointercancel', up);
      spin.scrollTrigger && spin.scrollTrigger.kill(); spin.kill();
      ring.style.transform = ''; figs.forEach(function (f) { f.style.transform = ''; f.style.removeProperty('--dim'); });
    };
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
