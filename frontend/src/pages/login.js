/**
 * Login Page
 */

import { createElement } from '../utils/dom.js';
import { login } from '../services/auth-service.js';
import { navigateTo } from '../router.js';
import eventBus, { EVENTS } from '../services/event-bus.js';

/**
 * Render login page
 * @param {HTMLElement} container - Container element
 */
export async function renderLoginPage(container) {
  const loginForm = createElement('div', { className: 'login-container' }, [
    createElement('div', { className: 'login-card card' }, [
      createElement('h1', { className: 'login-title' }, 'Bambi Basher'),
      createElement('p', { className: 'login-subtitle' }, 'Trail Camera Image Processing'),

      createElement('form', {
        className: 'login-form',
        onSubmit: handleSubmit
      }, [
        // Username field
        createElement('div', { className: 'form-group' }, [
          createElement('label', { for: 'username' }, 'Username'),
          createElement('input', {
            type: 'text',
            id: 'username',
            name: 'username',
            required: true,
            autofocus: true,
            placeholder: 'Enter your username'
          })
        ]),

        // Password field
        createElement('div', { className: 'form-group' }, [
          createElement('label', { for: 'password' }, 'Password'),
          createElement('input', {
            type: 'password',
            id: 'password',
            name: 'password',
            required: true,
            placeholder: 'Enter your password'
          })
        ]),

        // Error message container
        createElement('div', {
          id: 'login-error',
          className: 'form-error',
          style: { display: 'none' }
        }),

        // Submit button
        createElement('button', {
          type: 'submit',
          className: 'btn-primary btn-lg',
          style: { width: '100%' }
        }, 'Login')
      ]),

      // Demo credentials
      createElement('div', { className: 'login-demo' }, [
        createElement('p', { className: 'text-sm text-muted' }, 'Demo credentials:'),
        createElement('p', { className: 'text-sm' }, 'Admin: admin / admin123'),
        createElement('p', { className: 'text-sm' }, 'User: user / user123')
      ])
    ])
  ]);

  container.innerHTML = '';
  container.appendChild(loginForm);
}

/**
 * Handle login form submission
 * @param {Event} e - Submit event
 */
async function handleSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;
  const errorDiv = document.getElementById('login-error');
  const submitButton = form.querySelector('button[type="submit"]');

  // Clear previous error
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';

  // Disable submit button
  submitButton.disabled = true;
  submitButton.textContent = 'Logging in...';

  try {
    await login(username, password);

    // Show success notification
    eventBus.emit(EVENTS.NOTIFY_SUCCESS, 'Login successful');

    // Redirect to gallery
    navigateTo('/gallery');
  } catch (error) {
    // Show error message
    errorDiv.textContent = error.message || 'Invalid username or password';
    errorDiv.style.display = 'block';

    // Re-enable submit button
    submitButton.disabled = false;
    submitButton.textContent = 'Login';
  }
}

export default { renderLoginPage };
