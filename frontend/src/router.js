/**
 * Client-Side Router
 * Uses History API for navigation
 */

import { isAuthenticated, isAdmin } from './services/auth-service.js';

// Route registry
const routes = new Map();

// Current route state
let currentRoute = null;

// Route change listeners
let routeListeners = [];

/**
 * Register a route
 * @param {string} path - Route path (can include :param for dynamic segments)
 * @param {Function} component - Component render function
 * @param {Object} options - Route options (requireAuth, requireAdmin, title)
 */
export function registerRoute(path, component, options = {}) {
  routes.set(path, {
    component,
    ...options
  });
}

/**
 * Match path to route
 * @param {string} pathname - Path to match
 * @returns {Object|null} Matched route with params
 */
function matchRoute(pathname) {
  // Exact match first
  if (routes.has(pathname)) {
    return {
      route: routes.get(pathname),
      path: pathname,
      params: {}
    };
  }

  // Try pattern matching
  for (const [pattern, route] of routes.entries()) {
    if (!pattern.includes(':')) continue;

    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');

    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let matches = true;

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Dynamic segment
        const paramName = patternPart.substring(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // Segment doesn't match
        matches = false;
        break;
      }
    }

    if (matches) {
      return { route, path: pattern, params };
    }
  }

  return null;
}

/**
 * Navigate to path
 * @param {string} path - Path to navigate to
 * @param {boolean} replace - Replace current history entry
 */
export function navigateTo(path, replace = false) {
  if (replace) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
  }

  handleRoute();
}

/**
 * Handle current route
 */
async function handleRoute() {
  const pathname = window.location.pathname;

  const match = matchRoute(pathname);

  if (!match) {
    // No route found - show 404
    handleNotFound();
    return;
  }

  const { route, params } = match;

  // Check authentication requirements
  if (route.requireAuth && !isAuthenticated()) {
    navigateTo('/login', true);
    return;
  }

  // Check admin requirements
  if (route.requireAdmin && !isAdmin()) {
    navigateTo('/forbidden', true);
    return;
  }

  // Set document title
  if (route.title) {
    document.title = `${route.title} - Bambi Basher`;
  }

  // Update current route
  currentRoute = { path: pathname, params, route };

  // Notify listeners
  notifyRouteListeners(currentRoute);

  // Render component
  const container = document.getElementById('page-content');
  if (container && route.component) {
    try {
      await route.component(container, params);
    } catch (error) {
      console.error('Error rendering component:', error);
      handleError(error);
    }
  }
}

/**
 * Handle 404 not found
 */
function handleNotFound() {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = `
      <div class="container" style="text-align: center; padding: 4rem 0;">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <button class="btn-primary" onclick="window.router.navigateTo('/')">
          Go to Home
        </button>
      </div>
    `;
  }
}

/**
 * Handle route error
 * @param {Error} error - Error object
 */
function handleError(error) {
  const container = document.getElementById('page-content');
  if (container) {
    container.innerHTML = `
      <div class="container" style="text-align: center; padding: 4rem 0;">
        <h1>Error</h1>
        <p>Something went wrong loading this page.</p>
        <p class="text-muted">${error.message}</p>
        <button class="btn-primary" onclick="window.router.navigateTo('/')">
          Go to Home
        </button>
      </div>
    `;
  }
}

/**
 * Subscribe to route changes
 * @param {Function} listener - Listener function
 * @returns {Function} Unsubscribe function
 */
export function onRouteChange(listener) {
  routeListeners.push(listener);

  return () => {
    routeListeners = routeListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all route listeners
 * @param {Object} route - Current route
 */
function notifyRouteListeners(route) {
  routeListeners.forEach(listener => {
    try {
      listener(route);
    } catch (error) {
      console.error('Error in route listener:', error);
    }
  });
}

/**
 * Get current route
 * @returns {Object|null} Current route
 */
export function getCurrentRoute() {
  return currentRoute;
}

/**
 * Initialize router
 */
export function initRouter() {
  // Register routes
  registerAppRoutes();

  // Handle popstate (back/forward)
  window.addEventListener('popstate', handleRoute);

  // Handle link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/"]');

    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');
      navigateTo(href);
    }
  });

  // Handle initial route
  handleRoute();

  // Expose router to window for debugging
  window.router = {
    navigateTo,
    registerRoute,
    getCurrentRoute,
    onRouteChange
  };
}

/**
 * Register application routes
 */
function registerAppRoutes() {
  // Import pages dynamically
  const routes = [
    {
      path: '/',
      component: () => {
        // Redirect to gallery if authenticated, otherwise login
        if (isAuthenticated()) {
          navigateTo('/gallery', true);
        } else {
          navigateTo('/login', true);
        }
      },
      title: 'Home'
    },
    {
      path: '/login',
      component: async (container) => {
        const { renderLoginPage } = await import('./pages/login.js');
        await renderLoginPage(container);
      },
      title: 'Login'
    },
    {
      path: '/gallery',
      component: async (container) => {
        const { renderGalleryPage } = await import('./pages/gallery.js');
        await renderGalleryPage(container);
      },
      requireAuth: true,
      title: 'Gallery'
    },
    {
      path: '/statistics',
      component: async (container) => {
        const { renderStatisticsPage } = await import('./pages/statistics.js');
        await renderStatisticsPage(container);
      },
      requireAuth: true,
      title: 'Statistics'
    },
    {
      path: '/maps',
      component: async (container) => {
        const { renderMapsPage } = await import('./pages/maps.js');
        await renderMapsPage(container);
      },
      requireAuth: true,
      title: 'Maps'
    },
    {
      path: '/upload',
      component: async (container) => {
        const { renderUploadPage, cleanupUploadPage } = await import('./pages/upload.js');

        // Cleanup previous upload page if exists
        if (currentRoute?.route?.cleanup) {
          currentRoute.route.cleanup();
        }

        await renderUploadPage(container);
      },
      cleanup: () => {
        const { cleanupUploadPage } = require('./pages/upload.js');
        if (cleanupUploadPage) cleanupUploadPage();
      },
      requireAuth: true,
      requireAdmin: true,
      title: 'Upload'
    }
  ];

  routes.forEach(route => {
    registerRoute(route.path, route.component, route);
  });
}

export default {
  registerRoute,
  navigateTo,
  getCurrentRoute,
  onRouteChange,
  initRouter
};
