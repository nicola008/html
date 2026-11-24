/* Cabinets.com — Home page interactions (vanilla JS, no dependencies) */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Promo bar dismiss ---------- */
  const promo = $('#promoBar');
  if (sessionStorage.getItem('promoClosed')) promo.classList.add('is-hidden');
  $('[data-close-promo]').addEventListener('click', () => {
    promo.classList.add('is-hidden');
    sessionStorage.setItem('promoClosed', '1');
  });

  /* ---------- Sticky header shadow + mobile bar ---------- */
  const header = $('#siteHeader');
  const mobileBar = $('.mobile-bar');
  const hero = $('.hero');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    mobileBar.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Desktop mega menus (click + keyboard support; hover via CSS) ---------- */
  $$('.has-mega > .main-nav__link').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const item = btn.parentElement;
      const open = !item.classList.contains('is-open');
      $$('.has-mega.is-open').forEach(i => { i.classList.remove('is-open'); i.firstElementChild.setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', () => $$('.has-mega.is-open').forEach(i => i.classList.remove('is-open')));

  /* ---------- Search panel ---------- */
  const searchPanel = $('#searchPanel');
  $('[data-toggle-search]').addEventListener('click', () => {
    searchPanel.hidden = !searchPanel.hidden;
    if (!searchPanel.hidden) $('input', searchPanel).focus();
  });

  /* ---------- Mobile drawer ---------- */
  const drawer = $('#drawer');
  const burger = $('[data-open-drawer]');
  const setDrawer = open => {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setDrawer(true));
  $$('[data-close-drawer]').forEach(el => el.addEventListener('click', () => setDrawer(false)));

  /* ---------- Hero video play / pause ---------- */
  const heroVideo = $('.hero__video');
  const toggle = $('[data-video-toggle]');
  if (reduceMotion) { heroVideo.pause(); heroVideo.removeAttribute('autoplay'); toggle.classList.add('is-paused'); }
  toggle.addEventListener('click', () => {
    if (heroVideo.paused) { heroVideo.play(); toggle.classList.remove('is-paused'); toggle.setAttribute('aria-label', 'Pause background video'); }
    else { heroVideo.pause(); toggle.classList.add('is-paused'); toggle.setAttribute('aria-label', 'Play background video'); }
  });

  /* ---------- Lazy video loader ---------- */
  const loadVideo = v => {
    if (v.dataset.loaded) return;
    $$('source[data-src]', v).forEach(s => { s.src = s.dataset.src; });
    v.load();
    v.dataset.loaded = '1';
  };

  // Factory video: autoplay when in view
  const factoryVideo = $('[data-lazy-video]');
  if (factoryVideo && !reduceMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { loadVideo(en.target); en.target.play().catch(() => {}); }
        else en.target.pause();
      });
    }, { threshold: 0.25 }).observe(factoryVideo);
  }

  // Tool cards: play on hover
  $$('[data-hover-video]').forEach(v => {
    const card = v.closest('.tool-card');
    card.addEventListener('mouseenter', () => { if (reduceMotion) return; loadVideo(v); v.play().catch(() => {}); });
    card.addEventListener('mouseleave', () => v.pause());
  });

  /* ---------- Door styles carousel ---------- */
  $$('[data-carousel-next], [data-carousel-prev]').forEach(btn => {
    const track = document.getElementById(btn.dataset.carouselNext || btn.dataset.carouselPrev);
    const dir = btn.hasAttribute('data-carousel-next') ? 1 : -1;
    btn.addEventListener('click', () => {
      const card = track.firstElementChild;
      const step = card.getBoundingClientRect().width + 20;
      track.scrollBy({ left: dir * step, behavior: 'smooth' });
    });
  });
  const doorTrack = $('#doorTrack');
  const updateCarouselBtns = () => {
    const max = doorTrack.scrollWidth - doorTrack.clientWidth - 2;
    $('[data-carousel-prev="doorTrack"]').disabled = doorTrack.scrollLeft <= 2;
    $('[data-carousel-next="doorTrack"]').disabled = doorTrack.scrollLeft >= max;
  };
  doorTrack.addEventListener('scroll', updateCarouselBtns, { passive: true });
  window.addEventListener('resize', updateCarouselBtns);
  updateCarouselBtns();

  /* ---------- Finish configurator ---------- */
  const finishImg = $('#finishImg');
  const finishName = $('#finishName');
  const finishType = $('#finishType');
  const finishChip = $('#finishChip');
  const FINISH_BASE = 'https://www.cabinets.com/media/cms/homepage/finish-options/';
  const swatches = $$('.swatch');

  // Preload finish images so swaps feel instant
  swatches.forEach(s => { const i = new Image(); i.src = `${FINISH_BASE}${s.dataset.finish}.png?width=1000&format=webp`; });
  finishChip.style.setProperty('--c', getComputedStyle(swatches[0]).getPropertyValue('--c'));

  const selectSwatch = sw => {
    swatches.forEach(s => { s.classList.remove('is-active'); s.setAttribute('aria-checked', 'false'); s.tabIndex = -1; });
    sw.classList.add('is-active');
    sw.setAttribute('aria-checked', 'true');
    sw.tabIndex = 0;
    const { finish, name, type } = sw.dataset;
    finishImg.classList.add('is-swapping');
    setTimeout(() => {
      finishImg.src = `${FINISH_BASE}${finish}.png?width=1000&format=webp`;
      finishImg.alt = `Kitchen cabinets in ${name} ${type.toLowerCase()}`;
      finishImg.onload = () => finishImg.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 220);
    finishName.textContent = name;
    finishType.textContent = type;
    finishChip.style.setProperty('--c', getComputedStyle(sw).getPropertyValue('--c'));
  };
  swatches.forEach((sw, idx) => {
    sw.tabIndex = idx === 0 ? 0 : -1;
    sw.addEventListener('click', () => selectSwatch(sw));
    sw.addEventListener('keydown', e => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const next = swatches[(idx + keys[e.key] + swatches.length) % swatches.length];
      next.focus();
      selectSwatch(next);
    });
  });

  /* ---------- Gallery: show more ---------- */
  const bento = $('#bento');
  const moreBtn = $('[data-show-more]');
  moreBtn.addEventListener('click', () => {
    const expanded = bento.classList.toggle('is-expanded');
    moreBtn.textContent = expanded ? 'Show fewer kitchens' : 'Show more kitchens';
  });

  /* ---------- Gallery lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  let items = [];
  let current = 0;
  let lastFocus = null;

  const visibleItems = () => $$('.bento__item', bento).filter(i => i.offsetParent !== null);
  const show = i => {
    current = (i + items.length) % items.length;
    const it = items[current];
    lbImg.src = it.dataset.full;
    lbImg.alt = $('img', it).alt;
    lbCap.textContent = $('.bento__cap', it).textContent;
  };
  const openLb = i => {
    items = visibleItems();
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('[data-lb-close]').focus();
  };
  const closeLb = () => {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  $$('.bento__item', bento).forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      openLb(visibleItems().indexOf(item));
    });
  });
  $('[data-lb-close]').addEventListener('click', closeLb);
  $('[data-lb-prev]').addEventListener('click', () => show(current - 1));
  $('[data-lb-next]').addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!lb.hidden) closeLb();
      setDrawer(false);
      searchPanel.hidden = true;
      $$('.has-mega.is-open').forEach(i => i.classList.remove('is-open'));
    }
    if (!lb.hidden && e.key === 'ArrowRight') show(current + 1);
    if (!lb.hidden && e.key === 'ArrowLeft') show(current - 1);
  });

  /* ---------- Reveal on scroll + stat counters ---------- */
  const countUp = el => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const dur = 1400;
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
  }
})();
