/* UniqBee · Ajans Sunumu */
(function () {
  'use strict';
  window.__sunumReady = true;

  var html = document.documentElement;
  var hasLibs = !!(window.gsap && window.ScrollTrigger);
  if (html.classList.contains('anim') && !hasLibs) html.classList.remove('anim');
  var ANIM = html.classList.contains('anim');
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqDesk = window.matchMedia('(min-width: 900px)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* =========================================================
     ANALİTİK (GA4)
     ========================================================= */
  var params = new URLSearchParams(location.search);
  var marka = (params.get('marka') || 'genel').toLocaleLowerCase('tr')
    .replace(/[^a-z0-9çğıöşü-]/g, '').slice(0, 40) || 'genel';

  function ev(name, p, beacon) {
    try {
      var o = { marka: marka };
      for (var k in p) o[k] = p[k];
      if (beacon) o.transport_type = 'beacon';
      window.gtag && window.gtag('event', name, o);
    } catch (e) {}
  }

  var ref = 'dogrudan';
  try { if (document.referrer) ref = new URL(document.referrer).hostname; } catch (e) {}
  ev('sunum_acildi', { kaynak: ref, cihaz: mqDesk.matches ? 'masaustu' : 'mobil' });

  // bölüm görüntüleme + bölümde geçen süre
  var secs = $$('main section[id]');
  var seen = {}, acc = {}, since = {};
  var barNow = $('#barNow');

  function closeTimer(id) {
    if (since[id] != null) { acc[id] = (acc[id] || 0) + (performance.now() - since[id]); since[id] = null; }
  }
  var secIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var id = e.target.id;
      if (e.isIntersecting) {
        if (!seen[id]) { seen[id] = 1; ev('sunum_bolum_goruntuleme', { bolum: id, sira: secs.indexOf(e.target) + 1 }); }
        since[id] = performance.now();
        if (barNow) barNow.textContent = e.target.getAttribute('data-label') || '';
      } else closeTimer(id);
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  secs.forEach(function (s) { secIO.observe(s); });

  function flushTimes() {
    secs.forEach(function (s) {
      var id = s.id, open = since[id] != null;
      closeTimer(id);
      var sec = Math.round((acc[id] || 0) / 1000);
      if (sec >= 1) ev('sunum_bolum_suresi', { bolum: id, saniye: sec }, true);
      acc[id] = 0;
      if (open) since[id] = performance.now();
    });
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushTimes(); });
  window.addEventListener('pagehide', flushTimes);

  // scroll derinliği
  var depthSent = {};
  var progressEl = $('.progress');
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (progressEl) progressEl.style.transform = 'scaleX(' + p + ')';
    [25, 50, 75, 100].forEach(function (d) {
      if (!depthSent[d] && p * 100 >= d - 1) { depthSent[d] = 1; ev('sunum_scroll', { yuzde: d }); }
    });
  }
  var barEl = $('.bar');
  var _os = onScroll;
  onScroll = function () { _os(); if (barEl) barEl.classList.toggle('solid', window.scrollY > window.innerHeight * 0.85); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // CTA tıklamaları
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cta]');
    if (!a) return;
    var tip = a.getAttribute('data-cta');
    ev('sunum_cta', { tip: tip }, true);
    if (tip === 'pdf') ev('sunum_pdf_indir', {}, true);
  });

  /* =========================================================
     VİDEOLAR (lazy + hover önizleme + görünürken oynat)
     ========================================================= */
  function vidOf(m) { return m.querySelector('video'); }
  function play(m) {
    var v = vidOf(m); if (!v) return;
    if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
    var p = v.play();
    var ok = function () { m.classList.add('is-playing'); };
    if (p && p.then) p.then(ok).catch(function () {}); else ok();
  }
  function pause(m) {
    var v = vidOf(m); if (!v || !v.getAttribute('src')) return;
    v.pause(); m.classList.remove('is-playing');
  }

  // otomatik döngüler (hero, çıta) ve dokunmatik cihazda hover videoları
  var autoIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var m = e.target;
      var isHover = m.hasAttribute('data-hover');
      if (isHover && mqFine.matches) return; // masaüstünde hover yönetir
      if (e.isIntersecting) play(m); else pause(m);
    });
  }, { threshold: 0.35 });

  if (!RM && !saveData) {
    $$('.media').forEach(function (m) {
      var v = vidOf(m); if (!v) return;
      if (v.hasAttribute('data-auto') || m.hasAttribute('data-hover')) autoIO.observe(m);
    });
  }
  // hover önizleme (masaüstü, reduced-motion'da da kullanıcı tetiklediği için açık)
  $$('.media[data-hover]').forEach(function (m) {
    m.addEventListener('mouseenter', function () { if (mqFine.matches) play(m); });
    m.addEventListener('mouseleave', function () { if (mqFine.matches) pause(m); });
  });

  /* =========================================================
     VAKALAR: sayaç + görüntülenme
     ========================================================= */
  var cases = $$('.case');
  var caseNow = $('#caseNow'), caseBar = $('#caseBar');
  var total = cases.length;
  function setCase(p) {
    p = Math.max(0, Math.min(1, p));
    var i = Math.min(total, Math.round(p * (total - 1)) + 1);
    if (caseNow) caseNow.textContent = (i < 10 ? '0' : '') + i;
    if (caseBar) caseBar.style.transform = 'scaleX(' + Math.max(1 / total, p) + ')';
  }
  var caseSeen = {};
  var caseIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var k = e.target.getAttribute('data-case');
      if (!caseSeen[k]) { caseSeen[k] = 1; ev('sunum_vaka_goruntuleme', { vaka: k, sira: cases.indexOf(e.target) + 1 }); }
    });
  }, { threshold: 0.55 });
  cases.forEach(function (c) { caseIO.observe(c); });

  var track = $('#casesTrack');
  if (track) track.addEventListener('scroll', function () {
    var max = track.scrollWidth - track.clientWidth;
    if (max > 0) setCase(track.scrollLeft / max);
  }, { passive: true });

  /* =========================================================
     MOBİL WHATSAPP BUTONU
     ========================================================= */
  var fab = $('#fab');
  if (fab) {
    var vis = { acilis: true, iletisim: false };
    var fabIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      fab.classList.toggle('show', !vis.acilis && !vis.iletisim);
    }, { threshold: 0.1 });
    ['acilis', 'iletisim'].forEach(function (id) { var el = document.getElementById(id); if (el) fabIO.observe(el); });
  }

  /* =========================================================
     HİZMET İKONLARI: görünür olunca çizilir, sonra döngüye girer
     ========================================================= */
  var svcIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); svcIO.unobserve(e.target); } });
  }, { threshold: 0.4 });
  $$('.svc').forEach(function (s) { svcIO.observe(s); });

  if (!ANIM) { setCase(0); return; }

  /* =========================================================
     ANİMASYONLAR (GSAP + ScrollTrigger + Lenis)
     ========================================================= */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  // smooth scroll
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { duration: 1.6 }); else t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // kelime bazlı bölme
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/( +|\n+)/).forEach(function (part) {
          if (!part) return;
          if (/^[ \n]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) splitWords(n);
    });
  }

  $$('[data-split]').forEach(function (el) {
    splitWords(el);
    var words = $$('.wi', el);
    gsap.set(words, { yPercent: 115 });
    el.classList.add('ready');
    var isHero = !!el.closest('.hero');
    gsap.to(words, {
      yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.06, delay: isHero ? 0.25 : 0,
      scrollTrigger: isHero ? null : { trigger: el, start: 'top 85%', once: true }
    });
  });

  // genel yükselme
  $$('.rv').forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', delay: el.closest('.hero') ? 0.7 : 0,
      scrollTrigger: el.closest('.hero') ? null : { trigger: el, start: 'top 90%', once: true }
    });
  });

  // hero: kolaj girişi + parallax + metnin çekilmesi
  var heroTiles = $$('.hero__media .media');
  gsap.from(heroTiles, { scale: 1.08, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: 0.08 });
  gsap.to('.hero__in', { yPercent: -18, opacity: 0.15, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // biz: kelimeler okundukça aydınlanır
  $$('[data-scrub]').forEach(function (el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    (function wrap(list) {
      list.forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/( +)/).forEach(function (part) {
            if (!part) return;
            if (/^ +$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'sw'; s.textContent = part; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrap(Array.prototype.slice.call(n.childNodes));
      });
    })(nodes);
    gsap.to($$('.sw', el), { opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true } });
  });

  // görsel parallax
  $$('[data-par]').forEach(function (m) {
    var inner = $$('img, video', m);
    gsap.fromTo(inner, { yPercent: -7, scale: 1.16 }, { yPercent: 7, scale: 1.16, ease: 'none',
      scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // süreç: çizgi dolar, adımlar sırayla yanar
  var fill = $('.steps__fill'), steps = $$('.step');
  if (fill && steps.length) {
    ST.create({
      trigger: '.steps', start: 'top 75%',
      end: function () { return mqDesk.matches ? 'top 30%' : 'bottom 55%'; },
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var p = self.progress;
        fill.style.transform = (mqDesk.matches ? 'scaleX(' : 'scaleY(') + p + ')';
        steps.forEach(function (st, i) { st.classList.toggle('on', p >= i / steps.length); });
      }
    });
  }

  // vakalar: masaüstünde sabitlenmiş yatay galeri
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function () {
    if (!track) return;
    var dist = function () { return Math.max(0, track.scrollWidth - document.documentElement.clientWidth); };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: '#cases', start: 'center center+=32', end: function () { return '+=' + dist(); },
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (s) { setCase(s.progress); }
      }
    });
  });
  setCase(0);

  // özel imleç
  if (mqFine.matches) {
    var cur = $('.cur'), dot = $('.cur__dot'), ring = $('.cur__ring'), lbl = $('.cur__ring span');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    var curShown = false;
    window.addEventListener('mousemove', function (e) { if (!curShown) { curShown = true; gsap.to(cur, { opacity: 1, duration: 0.3 }); } dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor], a, button') : null;
      cur.classList.remove('big', 'link');
      if (!t) return;
      if (t.hasAttribute('data-cursor')) { lbl.textContent = t.getAttribute('data-cursor'); cur.classList.add('big'); }
      else cur.classList.add('link');
    });
    document.addEventListener('mouseleave', function () { gsap.to(cur, { opacity: 0, duration: 0.2 }); });
    document.addEventListener('mouseenter', function () { if (curShown) gsap.to(cur, { opacity: 1, duration: 0.2 }); });
  }

  window.addEventListener('load', function () { ST.refresh(); });
})();
