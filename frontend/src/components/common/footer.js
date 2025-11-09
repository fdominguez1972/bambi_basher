/**
 * Footer Component
 */

import { createElement } from '../../utils/dom.js';

/**
 * Create footer component
 * @returns {HTMLElement}
 */
export function createFooter() {
  const currentYear = new Date().getFullYear();

  return createElement('footer', { className: 'footer' }, [
    createElement('div', { className: 'container' }, [
      createElement('div', { className: 'footer-content' }, [
        createElement('p', { className: 'footer-text' }, [
          `© ${currentYear} Bambi Basher. All rights reserved.`
        ]),
        createElement('div', { className: 'footer-links' }, [
          createElement('a', {
            href: '/about',
            className: 'footer-link'
          }, 'About'),
          createElement('a', {
            href: '/privacy',
            className: 'footer-link'
          }, 'Privacy'),
          createElement('a', {
            href: '/terms',
            className: 'footer-link'
          }, 'Terms')
        ])
      ])
    ])
  ]);
}

/**
 * Render footer to container
 * @param {HTMLElement|string} container - Container element or selector
 */
export function renderFooter(container) {
  const containerEl = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!containerEl) {
    console.error('Footer container not found');
    return;
  }

  containerEl.innerHTML = '';
  containerEl.appendChild(createFooter());
}

export default { createFooter, renderFooter };
