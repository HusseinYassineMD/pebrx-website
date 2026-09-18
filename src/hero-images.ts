export const HERO_WIDTHS = [960, 1280, 1920] as const;

export function heroSrcSet(base: string, ext: 'jpg' | 'webp'): string {
  return HERO_WIDTHS.map((w) => `/images/heroes/${base}-${w}.${ext} ${w}w`).join(', ');
}

export const PAGE_HEROES: Record<string, string> = {
  'index.html': 'about-hero',
  'about.html': 'about-hero',
  'science.html': 'science-hero',
  'pipeline.html': 'pipeline-hero',
  'leadership.html': 'leadership-hero',
  'publications.html': 'publications-hero',
  'contact.html': 'contact-hero',
};

export function buildHeroPreload(base: string): string {
  return `<link rel="preload" as="image" type="image/webp" href="/images/heroes/${base}-960.webp" imagesrcset="${heroSrcSet(base, 'webp')}" imagesizes="100vw" fetchpriority="high">`;
}
