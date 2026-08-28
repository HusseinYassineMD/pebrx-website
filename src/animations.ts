export function initScrollAnimations(): void {
  const sections = document.querySelectorAll<HTMLElement>('.section, .landing-explore, .page-banner');

  if (!sections.length) return;

  sections.forEach((section) => section.classList.add('fade-section'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}
