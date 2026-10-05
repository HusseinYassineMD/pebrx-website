export function initScrollAnimations(): void {
  const sections = document.querySelectorAll<HTMLElement>(
    '.section, .landing-explore, .page-banner, .page-section, .discovery-band',
  );

  if (!sections.length) return;

  sections.forEach((section) => {
    section.classList.add('fade-section', 'visible');
  });
}
