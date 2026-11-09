// Progressive enhancement only: every page is complete without this script.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Mobile menu
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      const label = toggle.querySelector('.menu-toggle-label');
      if (label) label.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    // Only now collapse the menu on small screens: if this script never runs, the links stay visible.
    root.classList.add('nav-ready');
  }

  // Mobile contents: close after choosing a section
  document.querySelectorAll('.toc-mobile').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target.closest('a')) d.open = false; });
  });

  // Video: if the sources can't be loaded, show an honest unavailable state over the poster
  document.querySelectorAll('.video-frame video').forEach((video) => {
    const sources = [...video.querySelectorAll('source')];
    let shown = false;
    const fail = () => {
      if (shown) return;
      shown = true;
      const frame = video.closest('.video-frame');
      const note = document.createElement('p');
      note.className = 'video-unavailable';
      note.setAttribute('role', 'status');
      note.innerHTML = '<strong>Video unavailable</strong><span>The video couldn’t be loaded here. The description below explains what it shows.</span>';
      video.removeAttribute('controls');
      video.setAttribute('aria-hidden', 'true');
      frame.appendChild(note);
      const details = frame.parentElement.querySelector('.video-desc');
      if (details) details.open = true;
    };
    const last = sources[sources.length - 1];
    if (last) last.addEventListener('error', fail);
    video.addEventListener('error', fail);
    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) fail();
  });

  // Header border once the page scrolls
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Reveal on scroll, only when motion is welcome
  const reveals = document.querySelectorAll('.reveal');
  if (!reduce.matches && 'IntersectionObserver' in window && reveals.length) {
    root.classList.add('motion');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => {
      // Elements already in view on load are shown at once.
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
      else io.observe(el);
    });
  }

  // Highlight the current section in the case-study contents
  const tocLinks = [...document.querySelectorAll('.toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const headings = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tocLinks.forEach((a) => a.classList.remove('is-active'));
          byId.get(entry.target.id)?.classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach((h) => spy.observe(h));
    let hashId = '';
    try { hashId = decodeURIComponent(location.hash.slice(1)); } catch { hashId = ''; }
    const fromHash = byId.get(hashId);
    if (fromHash) fromHash.classList.add('is-active');
  }

  // Screenshot lightbox (links still open the full image without JavaScript)
  const dialog = document.querySelector('[data-lightbox-dialog]');
  if (dialog && typeof dialog.showModal === 'function') {
    const cap = dialog.querySelector('figcaption');
    let img = null;
    let opener = null;
    document.querySelectorAll('[data-lightbox]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        opener = link;
        if (!img) {
          img = document.createElement('img');
          img.alt = '';
          img.addEventListener('error', () => {
            const msg = document.createElement('p');
            msg.className = 'lightbox-error';
            msg.textContent = 'This image couldn’t be loaded.';
            img.replaceWith(msg);
            img = msg;
          });
          cap.before(img);
        }
        img.src = link.href;
        img.alt = link.dataset.alt || '';
        cap.textContent = link.dataset.caption || '';
        dialog.showModal();
      });
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { img?.remove(); img = null; opener?.focus(); });
  }
})();
