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

// ── Scroll reveal (IntersectionObserver) ──
// Stagger sibling .reveal cards within the same parent
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const siblings = [...el.parentElement.querySelectorAll('.reveal:not(.in)')];
    const idx = siblings.indexOf(el);
    setTimeout(() => el.classList.add('in'), idx * 70);
    revealObs.unobserve(el);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// (drag-to-scroll removed — grid layout)

// ── Smooth anchor scroll ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return; e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
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
    heroContent.style.transform = `translateY(${y * 0.16}px)`;
    heroContent.style.opacity   = 1 - y / (vh * 0.65);
  }
}, { passive: true });
