import '../styles.css';
import { initNavigation } from './nav';
import { initScrollAnimations } from './animations';
import { initContactForm } from './contact-form';
import { initNeuralHero } from './neural-hero';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initContactForm();
  initNeuralHero();
});
