/**
 * Header Component
 * Navigation bar with user info and logout
 */

import { createElement } from '../../utils/dom.js';
import { getCachedUser, logout, onAuthChange } from '../../services/auth-service.js';
import { navigateTo } from '../../router.js';
import eventBus, { EVENTS } from '../../services/event-bus.js';

let headerElement = null;

/**
 * Create header component
 * @returns {HTMLElement}
 */
export function createHeader() {
  const user = getCachedUser();

  headerElement = createElement('header', { className: 'header' }, [
    createElement('div', { className: 'container' }, [
      createElement('div', { className: 'header-content' }, [
        // Logo/Brand
        createElement('div', { className: 'header-brand' }, [
          createElement('a', {
            href: '/',
            className: 'brand-link'
          }, [
            createElement('h1', { className: 'brand-title' }, 'Bambi Basher')
          ])
        ]),

        // Navigation
        user ? createNav(user) : null,

        // User menu
        user ? createUserMenu(user) : null
      ])
    ])
  ]);

  // Listen for auth changes
  onAuthChange(handleAuthChange);

  return headerElement;
}

/**
 * Create navigation menu
 * @param {Object} user - Current user
 * @returns {HTMLElement}
 */
function createNav(user) {
  const navItems = [
    { path: '/gallery', label: 'Gallery' },
    { path: '/statistics', label: 'Statistics' },
    { path: '/maps', label: 'Maps' }
  ];

  // Add admin-only items
  if (user.role === 'admin') {
    navItems.push({ path: '/upload', label: 'Upload' });
  }

  return createElement('nav', { className: 'header-nav', role: 'navigation' }, [
    createElement('ul', { className: 'nav-list', role: 'list' },
      navItems.map(item =>
        createElement('li', { className: 'nav-item' }, [
          createElement('a', {
            href: item.path,
            className: 'nav-link',
            'aria-label': item.label
          }, item.label)
        ])
      )
    )
  ]);
}

/**
 * Create user menu
 * @param {Object} user - Current user
 * @returns {HTMLElement}
 */
function createUserMenu(user) {
  return createElement('div', { className: 'header-user' }, [
    createElement('span', { className: 'user-info' }, [
      createElement('span', { className: 'user-name' }, user.username),
      createElement('span', {
        className: `user-role ${user.role === 'admin' ? 'role-admin' : 'role-user'}`
      }, user.role)
    ]),
    createElement('button', {
      className: 'btn-secondary btn-sm',
      onClick: handleLogout,
      'aria-label': 'Logout'
    }, 'Logout')
  ]);
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await logout();
    eventBus.emit(EVENTS.AUTH_LOGOUT);
    navigateTo('/login');
  } catch (error) {
    console.error('Logout error:', error);
    eventBus.emit(EVENTS.NOTIFY_ERROR, 'Failed to logout');
  }
}

/**
 * Handle auth state change
 * @param {Object} user - Current user
 */
function handleAuthChange(user) {
  if (headerElement) {
    // Re-render header
    const newHeader = createHeader();
    headerElement.replaceWith(newHeader);
  }
}

/**
 * Render header to container
 * @param {HTMLElement|string} container - Container element or selector
 */
export function renderHeader(container) {
  const containerEl = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!containerEl) {
    console.error('Header container not found');
    return;
  }

  containerEl.innerHTML = '';
  containerEl.appendChild(createHeader());
}

export default { createHeader, renderHeader };
