/**
 * Modal Component
 * Reusable modal dialog
 */

import { createElement } from '../../utils/dom.js';

let activeModal = null;

/**
 * Create modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {HTMLElement|string} options.content - Modal content
 * @param {Array} options.actions - Action buttons
 * @param {Function} options.onClose - Close callback
 * @param {boolean} options.closeOnBackdrop - Close on backdrop click
 * @returns {HTMLElement}
 */
export function createModal(options = {}) {
  const {
    title = '',
    content = '',
    actions = [],
    onClose = null,
    closeOnBackdrop = true
  } = options;

  // Create modal backdrop
  const backdrop = createElement('div', {
    className: 'modal-backdrop',
    onClick: (e) => {
      if (closeOnBackdrop && e.target === backdrop) {
        closeModal();
      }
    }
  });

  // Create modal dialog
  const dialog = createElement('div', {
    className: 'modal-dialog',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': title ? 'modal-title' : undefined
  }, [
    // Modal header
    title && createElement('div', { className: 'modal-header' }, [
      createElement('h2', {
        className: 'modal-title',
        id: 'modal-title'
      }, title),
      createElement('button', {
        className: 'modal-close',
        'aria-label': 'Close modal',
        onClick: closeModal
      }, '×')
    ]),

    // Modal body
    createElement('div', { className: 'modal-body' }, [
      typeof content === 'string'
        ? createElement('p', {}, content)
        : content
    ]),

    // Modal footer (if actions provided)
    actions.length > 0 && createElement('div', { className: 'modal-footer' },
      actions.map(action => {
        const button = createElement('button', {
          className: action.className || 'btn-secondary',
          onClick: () => {
            if (action.onClick) {
              action.onClick();
            }
            if (!action.keepOpen) {
              closeModal();
            }
          }
        }, action.label);

        return button;
      })
    )
  ].filter(Boolean));

  backdrop.appendChild(dialog);

  // Store close callback
  backdrop.dataset.onClose = onClose ? 'true' : 'false';
  backdrop._closeCallback = onClose;

  return backdrop;
}

/**
 * Show modal
 * @param {Object} options - Modal options
 */
export function showModal(options) {
  // Close any existing modal
  if (activeModal) {
    closeModal();
  }

  const modal = createModal(options);
  const container = document.getElementById('modal-container');

  if (!container) {
    console.error('Modal container not found');
    return;
  }

  container.appendChild(modal);
  activeModal = modal;

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Focus first focusable element
  setTimeout(() => {
    const firstFocusable = modal.querySelector('button, a, input, textarea, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, 100);

  // Handle escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  modal.addEventListener('keydown', handleEscape);
  modal._escapeHandler = handleEscape;

  return modal;
}

/**
 * Close active modal
 */
export function closeModal() {
  if (!activeModal) return;

  // Call close callback
  if (activeModal._closeCallback) {
    activeModal._closeCallback();
  }

  // Remove modal
  activeModal.remove();
  activeModal = null;

  // Restore body scroll
  document.body.style.overflow = '';
}

/**
 * Confirm dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @returns {Promise<boolean>} User's choice
 */
export function confirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    showModal({
      title,
      content: message,
      actions: [
        {
          label: 'Cancel',
          className: 'btn-secondary',
          onClick: () => resolve(false)
        },
        {
          label: 'Confirm',
          className: 'btn-primary',
          onClick: () => resolve(true)
        }
      ],
      onClose: () => resolve(false)
    });
  });
}

/**
 * Alert dialog
 * @param {string} message - Alert message
 * @param {string} title - Dialog title
 * @returns {Promise<void>}
 */
export function alert(message, title = 'Alert') {
  return new Promise((resolve) => {
    showModal({
      title,
      content: message,
      actions: [
        {
          label: 'OK',
          className: 'btn-primary',
          onClick: () => resolve()
        }
      ],
      onClose: () => resolve()
    });
  });
}

export default {
  createModal,
  showModal,
  closeModal,
  confirm,
  alert
};
