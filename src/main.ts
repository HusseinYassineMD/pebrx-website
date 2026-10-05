import '../styles.css';
import { initNavigation } from './nav';
import { initScrollAnimations } from './animations';
import { initContactForm } from './contact-form';
import { initScrollSync } from './scroll-sync';

document.addEventListener('DOMContentLoaded', () => {
  initScrollSync();
  initNavigation();
  initScrollAnimations();
  initContactForm();

  const bootNeuralHero = (): void => {
    void import('./neural-hero').then(({ initNeuralHero }) => initNeuralHero());
  };

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const startNeuralHero = (): void => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(bootNeuralHero, { timeout: isMobile ? 6000 : 4000 });
    } else {
      globalThis.setTimeout(bootNeuralHero, isMobile ? 1500 : 800);
    }
  };

  globalThis.addEventListener('load', startNeuralHero, { once: true });
});
