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

// ── Process arrows sequential reveal ──
const arrows = document.querySelectorAll('.pstep__arrow');
if (arrows.length) {
  const processObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      arrows.forEach((a, i) => setTimeout(() => a.classList.add('visible'), 400 + i * 300));
      processObs.disconnect();
    });
  }, { threshold: 0.3 });
  const processSection = document.querySelector('.process__steps');
  if (processSection) processObs.observe(processSection);
}

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
