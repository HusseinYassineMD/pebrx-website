const MOBILE_BREAKPOINT = 960;

export function initNavigation(): void {
  const nav = document.querySelector<HTMLElement>('.nav');
  const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const navLinks = document.querySelector<HTMLUListElement>('.nav-links');
  const links = document.querySelectorAll<HTMLAnchorElement>('.nav-links a[data-nav]');

  if (!nav || !toggle || !navLinks) return;

  const navEl = nav;
  const toggleEl = toggle;
  const navLinksEl = navLinks;

  let backdrop = document.querySelector<HTMLButtonElement>('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-label', 'Close menu');
    document.body.appendChild(backdrop);
  }
  const backdropEl = backdrop;

  const currentPage = document.body.dataset.page ?? 'home';

  links.forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const isHome = currentPage === 'home';
  const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

  function setNavScrolled(scrolled: boolean): void {
    navEl.classList.toggle('scrolled', scrolled);
  }

  function closeMenu(): void {
    navLinksEl.classList.remove('open');
    toggleEl.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    backdropEl.classList.remove('visible');
  }

  function openMenu(): void {
    navLinksEl.classList.add('open');
    toggleEl.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    backdropEl.classList.add('visible');
  }

  toggleEl.addEventListener('click', () => {
    if (navLinksEl.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  backdropEl.addEventListener('click', closeMenu);

  links.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  navLinksEl.addEventListener('click', (event) => {
    if (event.target === navLinksEl) closeMenu();
  });

  function onScroll(): void {
    if (!isHome) {
      setNavScrolled(true);
      return;
    }
    setNavScrolled(window.scrollY > 60);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (!isMobile()) closeMenu();
  });

  if (!isHome) {
    navEl.classList.add('nav-inner');
    setNavScrolled(true);
  } else {
    onScroll();
  }
}
