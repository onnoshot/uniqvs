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

// ── Scroll reveal ──
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const siblings = [...(el.parentElement?.querySelectorAll('.reveal:not(.in)') || [])];
    const idx = Math.max(siblings.indexOf(el), 0);
    setTimeout(() => el.classList.add('in'), idx * 65);
    revealObs.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Animated number counters ──
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      // Ease out cubic
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
const tabs   = document.querySelectorAll('.work__tab');
const cards  = document.querySelectorAll('.work-card');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Active tab style
    tabs.forEach(t => t.classList.remove('work__tab--active'));
    tab.classList.add('work__tab--active');

    const cat = tab.dataset.cat;

    cards.forEach((card, i) => {
      const match = cat === 'all' || card.dataset.category === cat;
      if (match) {
        card.classList.remove('hidden');
        // Re-trigger reveal animation
        card.classList.remove('in');
        setTimeout(() => card.classList.add('in'), i * 40);
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
    const navH = 66;
    window.scrollTo({ top: t.offsetTop - navH, behavior: 'smooth' });
  });
});

// ── Hero parallax ──
const heroContent = document.querySelector('.hero__content');
window.addEventListener('scroll', () => {
  if (!heroContent) return;
  const y = window.scrollY;
  const vh = window.innerHeight;
  if (y < vh) {
    heroContent.style.transform = `translateY(${y * 0.15}px)`;
    heroContent.style.opacity = Math.max(0, 1 - y / (vh * 0.6));
  }
}, { passive: true });
