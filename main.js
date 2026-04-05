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

// ── Hero canvas + content parallax on scroll ──
const heroCanvas  = document.getElementById('heroCanvas');
const heroContent = document.querySelector('.hero__content');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const vh = window.innerHeight;
  if (y > vh) return;

  // Canvas drifts upward slowly (parallax depth)
  if (heroCanvas) heroCanvas.style.transform = `translateY(${y * 0.25}px)`;

  // Content fades + lifts
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

// ── Work tab filter + show more ──
const tabs      = document.querySelectorAll('.work__tab');
const cards     = document.querySelectorAll('.work-card');
const workMore  = document.getElementById('workMore');
const moreBtn   = document.getElementById('workMoreBtn');
let expanded    = false;

function applyFilter(cat) {
  expanded = false;
  let visIdx = 0;

  cards.forEach(card => {
    const match = cat === 'all' || card.dataset.category === cat;

    if (!match) {
      card.classList.add('hidden');
      card.classList.remove('show-extra');
      return;
    }

    card.classList.remove('hidden');

    if (cat === 'all' && card.classList.contains('work-card--extra')) {
      // hide extras in "all" view until expanded
      card.classList.remove('show-extra');
      card.classList.remove('in');
    } else {
      // category view: show everything
      card.classList.remove('work-card--extra'); // treat as visible
      card.classList.add('show-extra');
      card.classList.remove('in');
      setTimeout(() => card.classList.add('in'), visIdx++ * 45);
    }
  });

  // In "all" view animate first 4
  if (cat === 'all') {
    cards.forEach(card => {
      if (!card.classList.contains('work-card--extra') && !card.classList.contains('hidden')) {
        card.classList.remove('in');
        setTimeout(() => card.classList.add('in'), visIdx++ * 45);
      }
    });
    workMore && workMore.classList.remove('hidden');
    if (moreBtn) moreBtn.textContent = 'Tümünü Gör';
  } else {
    workMore && workMore.classList.add('hidden');
  }
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('work__tab--active'));
    tab.classList.add('work__tab--active');
    applyFilter(tab.dataset.cat);
  });
});

// Show more button
if (moreBtn) {
  moreBtn.addEventListener('click', () => {
    expanded = true;
    let visIdx = 0;
    cards.forEach(card => {
      if (card.classList.contains('work-card--extra') && !card.classList.contains('hidden')) {
        card.classList.add('show-extra');
        card.classList.remove('in');
        setTimeout(() => card.classList.add('in'), visIdx++ * 45);
      }
    });
    workMore.classList.add('hidden');
    // Smooth scroll to first new card
    const firstExtra = document.querySelector('.work-card--extra.show-extra');
    if (firstExtra) setTimeout(() => firstExtra.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  });
}

// Init
applyFilter('all');

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

// ── Smooth anchor scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return; e.preventDefault();
    window.scrollTo({ top: t.offsetTop - 66, behavior: 'smooth' });
  });
});
