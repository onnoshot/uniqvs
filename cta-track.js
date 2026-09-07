/* UniqBee — CTA / button click tracking (GA4). Standalone copy of the
   tracker in main.js, for pages (blog posts, backstage) that use their
   own inline nav script instead of loading main.js. */
(function () {
  var SECTION_IDS = ['hero', 'coverage', 'work', 'services', 'platforms', 'about', 'process', 'faq', 'blog', 'contact'];
  function sectionOf(el) {
    if (el.closest('#nav')) return 'nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.blog-article')) return 'article';
    if (el.closest('.blog-post-header')) return 'article';
    for (var i = 0; i < SECTION_IDS.length; i++) { if (el.closest('#' + SECTION_IDS[i])) return SECTION_IDS[i]; }
    return 'other';
  }
  function typeOf(el) {
    var href = el.getAttribute('href') || '';
    if (/^https:\/\/wa\.me\//.test(href)) return 'whatsapp';
    if (/instagram\.com/.test(href)) return 'instagram';
    if (/^mailto:/.test(href)) return 'email';
    if (/^tel:/.test(href)) return 'phone';
    if (el.classList.contains('nav__cta')) return 'nav_cta';
    if (el.classList.contains('btn')) return 'button';
    return 'link';
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;
    var trackable = el.matches(
      'a[href^="https://wa.me/"], a[href^="mailto:"], a[href^="tel:"], a[href*="instagram.com"], .btn, .nav__cta'
    );
    if (!trackable) return;
    if (typeof window.gtag !== 'function') return;
    var section = sectionOf(el);
    var type = typeOf(el);
    var label = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) || el.getAttribute('aria-label') || '';
    window.gtag('event', 'cta_click_' + type + '_' + section, {
      cta_type: type,
      cta_section: section,
      cta_label: label,
      cta_page: location.pathname,
    });
  }, true);
})();
