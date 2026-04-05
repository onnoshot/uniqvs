/* ═══════════════════════════════════════════════
   UniqBee — main.js
   ═══════════════════════════════════════════════ */

// ── Nav scroll ──
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Mobile burger ──
const burger   = document.getElementById('navBurger');
const navLinks = document.getElementById('navLinks');
let navOpen = false;
burger.addEventListener('click', () => {
  navOpen = !navOpen;
  navLinks.classList.toggle('open', navOpen);
  const [s1, s2] = burger.querySelectorAll('span');
  s1.style.transform = navOpen ? 'rotate(45deg) translate(4px,4px)' : '';
  s2.style.transform = navOpen ? 'rotate(-45deg) translate(4px,-4px)' : '';
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navOpen = false; navLinks.classList.remove('open');
  burger.querySelectorAll('span').forEach(s => s.style.transform = '');
}));

// ── Hero canvas — particle network ──
(function initNetwork() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CONFIG = {
    count:       110,      // number of particles
    maxDist:     160,      // max connection distance (px)
    speed:       0.45,     // base movement speed
    dotRadius:   2.2,      // particle dot size
    dotOpacity:  0.55,     // dot fill opacity
    lineOpacity: 0.18,     // max line opacity at closest range
    color:       '180, 18, 18',  // r,g,b
  };

  let W, H, dpr, animId;
  let particles = [];

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : (Math.random() < 0.5 ? -4 : H + 4);
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.r  = CONFIG.dotRadius * (0.6 + Math.random() * 0.8);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      // Soft bounce
      if (this.x < 0)   { this.x = 0;  this.vx *= -1; }
      if (this.x > W)   { this.x = W;  this.vx *= -1; }
      if (this.y < 0)   { this.y = 0;  this.vy *= -1; }
      if (this.y > H)   { this.y = H;  this.vy *= -1; }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.color}, ${CONFIG.dotOpacity})`;
      ctx.fill();
    }
  }

  function buildParticles() {
    particles = [];
    const n = Math.round(CONFIG.count * Math.min(1, (W * H) / (1440 * 900)));
    for (let i = 0; i < n; i++) particles.push(new Particle());
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    buildParticles();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections first (under dots)
    const maxD = CONFIG.maxDist;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxD) {
          const alpha = CONFIG.lineOpacity * (1 - dist / maxD);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${CONFIG.color}, ${alpha})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => { p.update(); p.draw(); });

    animId = requestAnimationFrame(draw);
  }

  function start() {
    resize();
    if (animId) cancelAnimationFrame(animId);
    draw();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });

  start();

  // Pause when scrolled past hero (perf)
  const heroEl = canvas.closest('.hero');
  if (heroEl) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (!animId) animId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animId); animId = null;
      }
    }, { threshold: 0.01 }).observe(heroEl);
  }
})();

// ── Hero canvas + content parallax on scroll (desktop only) ──
const heroCanvas  = document.getElementById('heroCanvas');
const heroContent = document.querySelector('.hero__content');
const isMobile    = () => window.innerWidth < 768;
window.addEventListener('scroll', () => {
  if (isMobile()) return;
  const y = window.scrollY;
  const vh = window.innerHeight;
  if (y > vh) return;
  if (heroCanvas) heroCanvas.style.transform = `translateY(${y * 0.25}px)`;
  if (heroContent) {
    heroContent.style.transform = `translateY(${y * 0.12}px)`;
    heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.55));
  }
}, { passive: true });

// ── Scroll reveal ──
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const siblings = [...(el.parentElement?.querySelectorAll('.reveal:not(.in)') || [])];
    const idx = Math.max(siblings.indexOf(el), 0);
    setTimeout(() => el.classList.add('in'), idx * 60);
    revealObs.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Animated number counters ──
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-item__num[data-count]').forEach(el => counterObs.observe(el));

// ── Work filter + show-more — premium motion system ──
(function initWork() {
  const tabs    = document.querySelectorAll('.work__tab');
  const cards   = [...document.querySelectorAll('.work-card')];
  const moreWrap = document.getElementById('workMore');
  const moreBtn  = document.getElementById('workMoreBtn');
  const FADE_OUT = 160;  // ms fade-out duration
  const STAGGER  = 42;   // ms between card entrances
  let activeCat  = 'all';
  let transitioning = false;

  // Mobile: scroll active tab into center
  function scrollTabCenter(tab) {
    const container = tab.closest('.work__tabs');
    if (!container) return;
    const tabCenter  = tab.offsetLeft + tab.offsetWidth / 2;
    const scrollLeft = tabCenter - container.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }

  // Decide which cards are "visible" for a given category + expand state
  function visibleCards(cat, expanded) {
    if (cat === 'all') {
      const base = cards.filter(c => !c.classList.contains('work-card--extra'));
      if (expanded) {
        const extra = cards.filter(c => c.classList.contains('work-card--extra'));
        return [...base, ...extra];
      }
      return base;
    }
    // Category: show all matching cards (extras included)
    return cards.filter(c => c.dataset.category === cat);
  }

  function staggerIn(subset) {
    subset.forEach((card, i) => {
      card.classList.remove('wc-out', 'wc-hidden');
      card.classList.remove('wc-in');
      requestAnimationFrame(() => {
        setTimeout(() => card.classList.add('wc-in'), i * STAGGER);
      });
    });
  }

  function applyFilter(cat, expanded) {
    if (transitioning) return;
    transitioning = true;

    const nextVisible = visibleCards(cat, expanded);
    const nextSet     = new Set(nextVisible);

    // --- Phase 1: fade out cards that won't be in next view ---
    const toHide = cards.filter(c => {
      if (c.classList.contains('work-card--extra') && !nextSet.has(c)) return false;
      return !c.classList.contains('wc-hidden') && !nextSet.has(c);
    });
    const toShow = nextVisible;

    // Mark outgoing
    toHide.forEach(c => {
      c.classList.remove('wc-in');
      c.classList.add('wc-out');
    });

    // After fade-out, update layout
    setTimeout(() => {
      // hide everything not in next view
      cards.forEach(c => {
        const isExtra = c.classList.contains('work-card--extra');
        if (nextSet.has(c)) {
          // ensure visible
          if (isExtra) { c.classList.add('wc-show'); c.style.display = ''; }
          c.classList.remove('wc-hidden', 'wc-out');
        } else {
          c.classList.remove('wc-in', 'wc-out', 'wc-show');
          c.classList.add('wc-hidden');
          if (isExtra) c.style.display = 'none';
        }
      });

      // --- Phase 2: stagger in ---
      staggerIn(toShow);

      // Show/hide "more" button
      const hasExtras = cards.some(c =>
        c.classList.contains('work-card--extra') &&
        (cat === 'all' ? true : c.dataset.category === cat)
      );
      const showMoreBtn = cat === 'all' && !expanded && hasExtras;
      if (moreWrap) moreWrap.classList.toggle('wc-hidden', !showMoreBtn);

      setTimeout(() => { transitioning = false; }, toShow.length * STAGGER + 200);
    }, FADE_OUT);
  }

  // Tab clicks
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.cat === activeCat) return;
      tabs.forEach(t => t.classList.remove('work__tab--active'));
      tab.classList.add('work__tab--active');
      activeCat = tab.dataset.cat;
      scrollTabCenter(tab);
      applyFilter(activeCat, false);
    });
  });

  // Show more
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      // Make extras display:block before animation
      cards.filter(c => c.classList.contains('work-card--extra') && c.dataset.category !== 'music'
        || c.classList.contains('work-card--extra')).forEach(c => {
        c.style.display = 'block';
        c.classList.add('wc-show');
      });
      applyFilter(activeCat, true);
    });
  }

  // Init: show first 12 cards with stagger
  const initial = visibleCards('all', false);
  cards.forEach(c => {
    if (!initial.includes(c)) {
      c.classList.add('wc-hidden');
      if (c.classList.contains('work-card--extra')) c.style.display = 'none';
    }
  });
  setTimeout(() => staggerIn(initial), 80);
  if (moreWrap) moreWrap.classList.remove('wc-hidden');
})();

// ── About: ab-reveal scroll entrance ──
(function(){
  const els = document.querySelectorAll('.ab-reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const delay = parseFloat(e.target.dataset.delay || 0);
      setTimeout(() => e.target.classList.add('ab-in'), delay);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  // Add stagger delays per section
  let sectionDelay = 0;
  let lastSection = null;
  els.forEach(el => {
    const section = el.closest('section');
    if (section !== lastSection) { sectionDelay = 0; lastSection = section; }
    el.dataset.delay = sectionDelay;
    sectionDelay += 90;
    obs.observe(el);
  });
})();

// ── About: system canvas ──
(function(){
  const canvas = document.getElementById('aboutCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, dpr, animId;
  let progress = 0; // 0→1 on scroll enter

  const nodes = [
    {x:.5, y:.5, r:6, label:'Core'},    // center
    {x:.5, y:.18, r:3.5},
    {x:.82, y:.34, r:3.5},
    {x:.82, y:.66, r:3.5},
    {x:.5, y:.82, r:3.5},
    {x:.18, y:.66, r:3.5},
    {x:.18, y:.34, r:3.5},
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]];
  let pulse = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const size = canvas.parentElement.offsetWidth;
    W = H = Math.min(size, 340);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    pulse = (pulse + 0.012) % (Math.PI * 2);
    const p = Math.min(progress, 1);

    // Rings
    [0.28, 0.42, 0.56].forEach((r, i) => {
      const pr = Math.max(0, Math.min(1, (p - i * 0.15) / 0.5));
      if (pr <= 0) return;
      ctx.beginPath();
      ctx.arc(W/2, H/2, r * W * pr, 0, Math.PI * 2);
      const pulseFade = 0.06 + Math.sin(pulse - i * 0.8) * 0.02;
      ctx.strokeStyle = `rgba(204,28,28,${pulseFade * pr})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Edges
    edges.forEach(([a, b], i) => {
      const pr = Math.max(0, Math.min(1, (p - i * 0.04) / 0.4));
      if (pr <= 0) return;
      const na = nodes[a], nb = nodes[b];
      ctx.beginPath();
      ctx.moveTo(na.x * W, na.y * H);
      ctx.lineTo(
        na.x * W + (nb.x * W - na.x * W) * pr,
        na.y * H + (nb.y * H - na.y * H) * pr
      );
      ctx.strokeStyle = `rgba(204,28,28,${0.12 * pr})`;
      ctx.lineWidth = .8;
      ctx.stroke();
    });

    // Nodes
    nodes.forEach((n, i) => {
      const pr = Math.max(0, Math.min(1, (p - i * 0.06) / 0.3));
      if (pr <= 0) return;
      const px = n.x * W, py = n.y * H;
      const pulsR = n.r + (i === 0 ? Math.sin(pulse) * 1.5 : Math.sin(pulse + i) * 0.6);
      ctx.beginPath();
      ctx.arc(px, py, pulsR * pr, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? `rgba(204,28,28,${0.85 * pr})` : `rgba(204,28,28,${0.35 * pr})`;
      ctx.fill();
    });

    animId = requestAnimationFrame(draw);
  }

  // Activate on scroll
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!animId) { resize(); draw(); }
      // animate progress
      let start = null;
      const ramp = ts => {
        if (!start) start = ts;
        progress = Math.min((ts - start) / 1200, 1);
        if (progress < 1) requestAnimationFrame(ramp);
      };
      requestAnimationFrame(ramp);
    } else {
      cancelAnimationFrame(animId); animId = null;
      progress = 0;
    }
  }, { threshold: 0.2 });
  obs.observe(canvas);
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); animId = null; resize(); if (progress > 0) draw(); });
})();

// ── About: principle pills ──
(function(){
  const pills = document.querySelectorAll('.ap-pill');
  const texts = document.querySelectorAll('.ap-text');
  if (!pills.length) return;
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('ap-pill--active'));
      texts.forEach(t => t.classList.remove('ap-text--active'));
      pill.classList.add('ap-pill--active');
      texts[pill.dataset.principle].classList.add('ap-text--active');
    });
  });
})();

// ── Process: scroll-activated step reveal ──
(function(){
  const steps = document.querySelectorAll('.pstep2');
  if (!steps.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const i = parseInt(entry.target.dataset.step || 0);
      setTimeout(() => entry.target.classList.add('ps-in'), i * 160);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
  steps.forEach(s => obs.observe(s));
})();

// ── Work card touch reveal (mobile) ──
document.querySelectorAll('.work-card').forEach(card => {
  card.addEventListener('touchstart', () => {
    // clear others
    document.querySelectorAll('.work-card.wc-touched').forEach(c => c.classList.remove('wc-touched'));
    card.classList.add('wc-touched');
  }, { passive: true });
});
document.addEventListener('touchstart', e => {
  if (!e.target.closest('.work-card')) {
    document.querySelectorAll('.work-card.wc-touched').forEach(c => c.classList.remove('wc-touched'));
  }
}, { passive: true });

// ── Smooth anchor scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return; e.preventDefault();
    window.scrollTo({ top: t.offsetTop - 66, behavior: 'smooth' });
  });
});
