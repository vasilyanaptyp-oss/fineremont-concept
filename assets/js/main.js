/* Файний Ремонт — animations. GSAP + ScrollTrigger (CDN). Degrades to static if GSAP is missing. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (rm || !hasGsap) doc.classList.add('rm');

  /* ---------- Header / mobile menu ---------- */
  var hdr = document.getElementById('hdr');
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  function onScrollHdr() { hdr.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();
  function closeMenu() { burger.setAttribute('aria-expanded', 'false'); mnav.hidden = true; document.body.style.overflow = ''; }
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu(); else { burger.setAttribute('aria-expanded', 'true'); mnav.hidden = false; document.body.style.overflow = 'hidden'; }
  });
  mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* ---------- Split manifesto into words (needed for reveal) ---------- */
  var mani = document.getElementById('mani');
  if (mani) {
    mani.innerHTML = mani.textContent.split(/\s+/).map(function (w) { return '<span class="mw">' + w + '</span>'; }).join(' ');
  }

  if (doc.classList.contains('rm')) {
    // static fallback: counters at final values
    document.querySelectorAll('.cnt').forEach(function (el) { el.textContent = el.getAttribute('data-to'); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetCheck: false });

  /* ---------- Progress bar ---------- */
  gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------- HERO: text intro + 3D card stack ---------- */
  var cards = gsap.utils.toArray('.c3');
  var stageInner = document.getElementById('stageInner');
  var isMobile = function () { return window.innerWidth < 900; };

  // Target layout for the fan (desktop) — x/y in % of card width, z in px
  function layout(i, n) {
    var m = isMobile();
    var t = (i - (n - 1) / 2);            // -3..3
    var sx = m ? 62 : Math.min(165, window.innerWidth * 0.105); // keep the fan clear of the headline on narrow desktops
    return {
      x: t * sx,
      y: Math.abs(t) * (m ? 12 : 26) - (m ? 0 : 24) + (i % 2 ? 18 : -18),
      z: -Math.abs(t) * (m ? 80 : 120),
      ry: t * -13,
      rx: 6,
      rz: t * 2.5
    };
  }

  // start: all stacked at center, deep in z
  gsap.set(cards, { x: 0, y: 40, z: -600, rotateY: 0, rotateX: 10, rotateZ: 0, opacity: 0, transformOrigin: '50% 50%' });
  gsap.set(stageInner, { rotateY: -14, rotateX: 6 });

  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.hero__h .w', { yPercent: 110, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.1)
       .from('.eyebrow', { y: 12, opacity: 0, duration: .8 }, 0.1)
       .from('.hero__sub, .hero__cta', { y: 24, opacity: 0, duration: 1, stagger: .1 }, 0.5);
  cards.forEach(function (c, i) {
    var L = layout(i, cards.length);
    intro.to(c, { x: L.x, y: L.y, z: L.z, rotateY: L.ry, rotateX: L.rx, rotateZ: L.rz, opacity: 1, duration: 1.5, ease: 'expo.out' }, 0.25 + i * 0.07);
  });

  // mouse parallax on the whole stage
  var stage = document.getElementById('stage');
  var qx = gsap.quickTo(stageInner, 'rotateY', { duration: 0.9, ease: 'power3.out' });
  var qy = gsap.quickTo(stageInner, 'rotateX', { duration: 0.9, ease: 'power3.out' });
  window.addEventListener('pointermove', function (e) {
    if (isMobile() || e.pointerType === 'touch') return;
    var nx = (e.clientX / window.innerWidth - 0.5), ny = (e.clientY / window.innerHeight - 0.5);
    qx(-14 + nx * 16); qy(6 - ny * 10);
  }, { passive: true });

  // scroll (desktop): pin hero, cards fly apart & copy fades. Mobile: light drift, no pin.
  var mmHero = gsap.matchMedia();
  mmHero.add('(min-width: 900px)', function () {
    var heroTl = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=120%', pin: '.hero__pin', scrub: 0.6, anticipatePin: 1 }
    });
    cards.forEach(function (c, i) {
      var L = layout(i, cards.length);
      var t = (i - (cards.length - 1) / 2);
      heroTl.to(c, { x: L.x * 1.9, y: L.y - 260 - Math.abs(t) * 40, z: L.z + 260, rotateY: L.ry * 2.2, rotateZ: t * 9, opacity: 0.0, ease: 'power1.in' }, 0);
    });
    heroTl.to('.hero__copy', { y: -120, opacity: 0, ease: 'power1.in' }, 0)
          .to('.hero__scroll', { opacity: 0 }, 0);
  });
  mmHero.add('(max-width: 899px)', function () {
    gsap.to(stageInner, { rotateY: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
  });

  /* ---------- Counters ---------- */
  document.querySelectorAll('.cnt').forEach(function (el) {
    var to = +el.getAttribute('data-to');
    var o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', snap: { v: 1 },
      onUpdate: function () { el.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  gsap.from('.num', { y: 30, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.nums', start: 'top 80%', once: true } });

  /* ---------- Manifesto word reveal ---------- */
  if (mani) {
    gsap.to('.mani__t .mw', { opacity: 1, stagger: 0.04, ease: 'none',
      scrollTrigger: { trigger: '.mani', start: 'top 70%', end: 'bottom 60%', scrub: 0.4 } });
  }

  /* ---------- Section headings ---------- */
  gsap.utils.toArray('.svc__head, .gal__head, .proc__head, .rev__head, .ord__copy').forEach(function (el) {
    gsap.from(el.children, { y: 28, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 82%', once: true } });
  });

  /* ---------- Services: horizontal scroll (desktop only) ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    var track = document.getElementById('hsTrack');
    var hs = document.getElementById('hs');
    var getDist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 48); };
    var tween = gsap.to(track, { x: function () { return -getDist(); }, ease: 'none',
      scrollTrigger: { trigger: hs, start: 'top 12%', end: function () { return '+=' + getDist(); }, pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 } });
    gsap.from('.sc', { y: 40, opacity: 0, stagger: .05, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: hs, start: 'top 70%', once: true } });
    return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
  });

  /* ---------- 3D ring gallery ---------- */
  var ring = document.getElementById('ring');
  var ringWrap = document.getElementById('ringWrap');
  var figs = gsap.utils.toArray('#ring figure');
  var N = figs.length, step = 360 / N;
  var state = { rot: 0, drag: 0 };
  function radius() {
    var w = figs[0].offsetWidth || 340;
    return Math.round((w / 2) / Math.tan(Math.PI / N) * 1.12);
  }
  function placeRing() {
    var R = radius();
    // figures sit on the cylinder; the ring itself rotates
    figs.forEach(function (f, i) { f.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R + 'px)'; });
  }
  placeRing();
  window.addEventListener('resize', placeRing);

  function renderRing() {
    var a = state.rot + state.drag;
    ring.style.transform = 'translateZ(' + (-radius()) + 'px) rotateY(' + a + 'deg)';
    // dim/scale cards that face away
    figs.forEach(function (f, i) {
      var ang = ((i * step + a) % 360 + 360) % 360;   // 0 = facing viewer
      var d = Math.abs(ang > 180 ? ang - 360 : ang) / 180;  // 0 front .. 1 back
      f.style.opacity = String(1 - d * 0.75);
      f.style.filter = 'brightness(' + (1 - d * 0.5) + ')';
    });
  }
  mm.add('(min-width: 900px)', function () {
    // desktop: pin the section and spin a full turn while it stays on screen
    var t = gsap.to(state, { rot: -360, ease: 'none',
      scrollTrigger: { trigger: '.gal', start: 'top top', end: '+=150%', pin: '.gal__pin', scrub: 0.7, anticipatePin: 1, onUpdate: renderRing } });
    return function () { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); };
  });
  mm.add('(max-width: 899px)', function () {
    // mobile: no pin (no dead space), half a turn while the section passes by; swipe does the rest
    var t = gsap.to(state, { rot: -180, ease: 'none',
      scrollTrigger: { trigger: '.gal', start: 'top bottom', end: 'bottom top', scrub: 0.5, onUpdate: renderRing } });
    return function () { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); };
  });
  renderRing();

  // drag / swipe
  var px = 0, dragging = false, startDrag = 0;
  ringWrap.addEventListener('pointerdown', function (e) { dragging = true; px = e.clientX; startDrag = state.drag; ringWrap.classList.add('is-drag'); ringWrap.setPointerCapture(e.pointerId); });
  ringWrap.addEventListener('pointermove', function (e) { if (!dragging) return; state.drag = startDrag + (e.clientX - px) * 0.35; renderRing(); });
  function endDrag() { dragging = false; ringWrap.classList.remove('is-drag'); }
  ringWrap.addEventListener('pointerup', endDrag); ringWrap.addEventListener('pointercancel', endDrag);

  /* ---------- Process: stacked cards scale ---------- */
  var steps = gsap.utils.toArray('.step');
  steps.forEach(function (s, i) {
    if (i === steps.length - 1) return;
    gsap.to(s, { scale: 0.92 - (steps.length - 2 - i) * 0.02, opacity: 0.55, ease: 'none',
      scrollTrigger: { trigger: steps[i + 1], start: 'top 80%', end: 'top 20%', scrub: true } });
  });

  /* ---------- Reviews cards ---------- */
  gsap.from('.q', { y: 40, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.rev__grid', start: 'top 80%', once: true } });
  gsap.from('.gar__i', { y: 30, opacity: 0, stagger: .08, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.gar', start: 'top 80%', once: true } });
  gsap.from('.form', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.form', start: 'top 85%', once: true } });

  /* ---------- Viber FAB: step aside where the page already offers Viber ---------- */
  var fab = document.querySelector('.fab');
  if (fab && 'IntersectionObserver' in window) {
    var seen = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? seen.add(e.target) : seen.delete(e.target); });
      fab.classList.toggle('is-hidden', seen.size > 0);
    }, { threshold: 0.05 });
    document.querySelectorAll('.ord, .ftr').forEach(function (el) { io.observe(el); });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
