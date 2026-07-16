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
  document.body.classList.toggle('nav-open', navOpen);
  const [s1, s2] = burger.querySelectorAll('span');
  s1.style.transform = navOpen ? 'rotate(45deg) translate(4px,4px)' : '';
  s2.style.transform = navOpen ? 'rotate(-45deg) translate(4px,-4px)' : '';
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navOpen = false; navLinks.classList.remove('open');
  document.body.classList.remove('nav-open');
  burger.querySelectorAll('span').forEach(s => s.style.transform = '');
}));

// ── Hero map background + content parallax on scroll (desktop only) ──
const heroMapBg    = document.getElementById('heroMapBg');
const heroContent = document.querySelector('.hero__content');
const isMobile    = () => window.innerWidth < 768;
window.addEventListener('scroll', () => {
  if (isMobile()) return;
  const y = window.scrollY;
  const vh = window.innerHeight;
  if (y > vh) return;
  if (heroMapBg) heroMapBg.style.transform = `translateY(${y * 0.25}px)`;
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
document.querySelectorAll('.stat-card__num[data-count]').forEach(el => counterObs.observe(el));

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

// ── Page loader ──
(function(){
  const loader = document.getElementById('site-loader');
  if (!loader) return;
  if (sessionStorage.getItem('ub_v')) { loader.style.display = 'none'; return; }
  const hide = () => {
    loader.classList.add('loaded');
    setTimeout(() => { loader.style.display = 'none'; }, 540);
    sessionStorage.setItem('ub_v', '1');
  };
  if (document.readyState === 'complete') { setTimeout(hide, 360); }
  else { window.addEventListener('load', () => setTimeout(hide, 360)); }
})();

// custom cursor removed
