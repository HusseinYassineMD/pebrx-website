import '../styles.css';
import { initNavigation } from './nav';
import { initScrollAnimations } from './animations';
import { initContactForm } from './contact-form';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initContactForm();

  const canRunNeuralHero = window.matchMedia(
    '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)',
  ).matches;

  if (canRunNeuralHero) {
    const bootNeuralHero = (): void => {
      void import('./neural-hero').then(({ initNeuralHero }) => initNeuralHero());
    };

    const startNeuralHero = (): void => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(bootNeuralHero, { timeout: 8000 });
      } else {
        globalThis.setTimeout(bootNeuralHero, 2000);
      }
    };

    globalThis.addEventListener('load', startNeuralHero, { once: true });
  }
});
