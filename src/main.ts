import '../styles.css';
import { initNavigation } from './nav';
import { initScrollAnimations } from './animations';
import { initContactForm } from './contact-form';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initContactForm();
});
