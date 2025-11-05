/**
 * Main Application Entry Point
 */

import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';
import './styles/accessibility.css';
import './styles/pages.css';
import './components/common/header.css';
import './components/common/footer.css';
import './components/common/modal.css';
import './components/common/notification.css';

import { initAuth } from './services/auth-service.js';
import { initRouter } from './router.js';
import { renderHeader } from './components/common/header.js';
import { renderFooter } from './components/common/footer.js';
import { initNotifications } from './components/common/notification.js';

/**
 * Initialize application
 */
async function initApp() {
  try {
    console.log('Initializing Bambi Basher...');

    // Initialize notification system
    initNotifications();

    // Initialize authentication
    console.log('Checking authentication...');
    const user = await initAuth();

    if (user) {
      console.log('User authenticated:', user.username);
    } else {
      console.log('No active session');
    }

    // Render header and footer
    renderHeader('#header');
    renderFooter('#footer');

    // Initialize router
    console.log('Initializing router...');
    initRouter();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);

    // Show error message
    const container = document.getElementById('page-content');
    if (container) {
      container.innerHTML = `
        <div class="container" style="text-align: center; padding: 4rem 0;">
          <h1>Application Error</h1>
          <p>Failed to start the application. Please refresh the page.</p>
          <p class="text-muted">${error.message}</p>
        </div>
      `;
    }
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Export for debugging
window.app = {
  version: '1.0.0',
  name: 'Bambi Basher'
};
