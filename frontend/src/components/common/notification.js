/**
 * Notification Component
 * Toast notifications
 */

import { createElement } from '../../utils/dom.js';
import eventBus, { EVENTS } from '../../services/event-bus.js';

const DEFAULT_DURATION = 5000; // 5 seconds

/**
 * Create notification element
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Duration in ms
 * @returns {HTMLElement}
 */
export function createNotification(message, type = 'info', duration = DEFAULT_DURATION) {
  const notification = createElement('div', {
    className: `notification notification-${type}`,
    role: 'alert',
    'aria-live': type === 'error' ? 'assertive' : 'polite'
  }, [
    createElement('div', { className: 'notification-content' }, [
      // Icon
      createElement('span', { className: 'notification-icon', 'aria-hidden': 'true' },
        getIcon(type)
      ),
      // Message
      createElement('span', { className: 'notification-message' }, message),
      // Close button
      createElement('button', {
        className: 'notification-close',
        'aria-label': 'Close notification',
        onClick: () => removeNotification(notification)
      }, '×')
    ])
  ]);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }

  return notification;
}

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @returns {string} Icon character
 */
function getIcon(type) {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {number} duration - Duration in ms
 */
export function showNotification(message, type = 'info', duration = DEFAULT_DURATION) {
  const container = document.getElementById('notification-container');

  if (!container) {
    console.error('Notification container not found');
    return;
  }

  const notification = createNotification(message, type, duration);
  container.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('notification-visible');
  }, 10);
}

/**
 * Remove notification
 * @param {HTMLElement} notification - Notification element
 */
function removeNotification(notification) {
  notification.classList.add('notification-hiding');

  setTimeout(() => {
    notification.remove();
  }, 300); // Match animation duration
}

/**
 * Show success notification
 * @param {string} message - Message
 * @param {number} duration - Duration in ms
 */
export function showSuccess(message, duration = DEFAULT_DURATION) {
  showNotification(message, 'success', duration);
}

/**
 * Show error notification
 * @param {string} message - Message
 * @param {number} duration - Duration in ms (0 = no auto-close)
 */
export function showError(message, duration = 0) {
  showNotification(message, 'error', duration);
}

/**
 * Show warning notification
 * @param {string} message - Message
 * @param {number} duration - Duration in ms
 */
export function showWarning(message, duration = DEFAULT_DURATION) {
  showNotification(message, 'warning', duration);
}

/**
 * Show info notification
 * @param {string} message - Message
 * @param {number} duration - Duration in ms
 */
export function showInfo(message, duration = DEFAULT_DURATION) {
  showNotification(message, 'info', duration);
}

/**
 * Initialize notification system
 * Set up event listeners for global notifications
 */
export function initNotifications() {
  eventBus.on(EVENTS.NOTIFY_SUCCESS, showSuccess);
  eventBus.on(EVENTS.NOTIFY_ERROR, showError);
  eventBus.on(EVENTS.NOTIFY_WARNING, showWarning);
  eventBus.on(EVENTS.NOTIFY_INFO, showInfo);
}

export default {
  createNotification,
  showNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  initNotifications
};
