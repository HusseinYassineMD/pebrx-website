export function initScrollAnimations(): void {
  const sections = document.querySelectorAll<HTMLElement>(
    '.section, .landing-explore, .page-banner, .page-section, .discovery-band'
  );

  if (!sections.length) return;

  sections.forEach((section) => section.classList.add('fade-section'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrowViewport = window.matchMedia('(max-width: 960px)').matches;

  if (reduceMotion || narrowViewport) {
    sections.forEach((section) => section.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -12px 0px' },
  );

  sections.forEach((section) => observer.observe(section));
}
