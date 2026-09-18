import '../styles.css';
import { initNavigation } from './nav';
import { initScrollAnimations } from './animations';
import { initContactForm } from './contact-form';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initContactForm();

  const bootNeuralHero = (): void => {
    void import('./neural-hero').then(({ initNeuralHero }) => initNeuralHero());
  };

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const startNeuralHero = (): void => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(bootNeuralHero, { timeout: isMobile ? 5000 : 2500 });
    } else {
      globalThis.setTimeout(bootNeuralHero, isMobile ? 1200 : 200);
    }
  };

  if (isMobile) {
    globalThis.addEventListener('load', startNeuralHero, { once: true });
  } else {
    startNeuralHero();
  }
});
