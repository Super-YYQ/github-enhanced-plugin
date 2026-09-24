import { startEnhancer } from './mount';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => startEnhancer(), { once: true });
} else {
  startEnhancer();
}
