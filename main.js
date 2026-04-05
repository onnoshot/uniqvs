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

// ── Hero canvas wave animation ──
(function initWaves() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Wave config — subtle, low density, red
  const waves = [
    { amp: 28, freq: 0.0022, speed: 0.00028, phase: 0,    yRatio: 0.22, opacity: 0.13, width: 0.7 },
    { amp: 18, freq: 0.0035, speed: 0.00018, phase: 2.1,  yRatio: 0.38, opacity: 0.09, width: 0.5 },
    { amp: 38, freq: 0.0015, speed: 0.00022, phase: 4.5,  yRatio: 0.52, opacity: 0.11, width: 0.8 },
    { amp: 14, freq: 0.0048, speed: 0.00032, phase: 1.2,  yRatio: 0.65, opacity: 0.07, width: 0.4 },
    { amp: 24, freq: 0.0026, speed: 0.00015, phase: 3.8,  yRatio: 0.78, opacity: 0.10, width: 0.6 },
  ];

  let W, H, dpr, animId, t = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    waves.forEach(w => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(180, 20, 20, ${w.opacity})`;
      ctx.lineWidth   = w.width;
      ctx.lineCap     = 'round';

      const baseY = H * w.yRatio;
      for (let x = 0; x <= W; x += 2) {
        const y = baseY + Math.sin(x * w.freq + t * w.speed * 1000 + w.phase) * w.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    t = performance.now();
    animId = requestAnimationFrame(draw);
  }

  function start() {
    resize();
    if (animId) cancelAnimationFrame(animId);
    draw();
  }

  // Throttled resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 120);
  });

  start();

  // Pause when hero is off screen (perf)
  const heroEl = canvas.closest('.hero');
  if (heroEl) {
    const pauseObs = new IntersectionObserver(entries => {
      entries[0].isIntersecting
        ? (animId || (animId = requestAnimationFrame(draw)))
        : (cancelAnimationFrame(animId), animId = null);
    }, { threshold: 0.01 });
    pauseObs.observe(heroEl);
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

// ── Work tab filter ──
const tabs  = document.querySelectorAll('.work__tab');
const cards = document.querySelectorAll('.work-card');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('work__tab--active'));
    tab.classList.add('work__tab--active');
    const cat = tab.dataset.cat;
    let visIdx = 0;
    cards.forEach(card => {
      const match = cat === 'all' || card.dataset.category === cat;
      if (match) {
        card.classList.remove('hidden');
        card.classList.remove('in');
        setTimeout(() => card.classList.add('in'), visIdx++ * 45);
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ── Smooth anchor scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return; e.preventDefault();
    window.scrollTo({ top: t.offsetTop - 66, behavior: 'smooth' });
  });
});
