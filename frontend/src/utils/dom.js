/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes and properties
 * @param {Array|string|HTMLElement} children - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes and properties
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  // Append children
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(child => {
    if (child) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    }
  });

  return element;
}

/**
 * Mount component to DOM
 * @param {HTMLElement} element - Element to mount
 * @param {HTMLElement|string} container - Container element or selector
 */
export function mount(element, container) {
  const containerEl = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!containerEl) {
    console.error('Container not found:', container);
    return;
  }

  containerEl.appendChild(element);
}

/**
 * Replace container contents with element
 * @param {HTMLElement} element - Element to mount
 * @param {HTMLElement|string} container - Container element or selector
 */
export function render(element, container) {
  const containerEl = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!containerEl) {
    console.error('Container not found:', container);
    return;
  }

  containerEl.innerHTML = '';
  containerEl.appendChild(element);
}

/**
 * Unmount element from DOM
 * @param {HTMLElement} element - Element to unmount
 */
export function unmount(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Clear all children from element
 * @param {HTMLElement|string} element - Element or selector
 */
export function clear(element) {
  const el = typeof element === 'string'
    ? document.querySelector(element)
    : element;

  if (el) {
    el.innerHTML = '';
  }
}

/**
 * Query selector helper
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all helper
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement[]}
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Add class(es) to element
 * @param {HTMLElement} element - Target element
 * @param {...string} classNames - Class names to add
 */
export function addClass(element, ...classNames) {
  if (element) {
    element.classList.add(...classNames);
  }
}

/**
 * Remove class(es) from element
 * @param {HTMLElement} element - Target element
 * @param {...string} classNames - Class names to remove
 */
export function removeClass(element, ...classNames) {
  if (element) {
    element.classList.remove(...classNames);
  }
}

/**
 * Toggle class on element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add or remove
 */
export function toggleClass(element, className, force = undefined) {
  if (element) {
    element.classList.toggle(className, force);
  }
}

/**
 * Check if element has class
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to check
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element ? element.classList.contains(className) : false;
}

/**
 * Set attributes on element
 * @param {HTMLElement} element - Target element
 * @param {Object} attributes - Attributes to set
 */
export function setAttributes(element, attributes) {
  if (element) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
}

/**
 * Remove attributes from element
 * @param {HTMLElement} element - Target element
 * @param {...string} attributes - Attribute names to remove
 */
export function removeAttributes(element, ...attributes) {
  if (element) {
    attributes.forEach(attr => element.removeAttribute(attr));
  }
}

/**
 * Show element (remove hidden class/attribute)
 * @param {HTMLElement} element - Target element
 */
export function show(element) {
  if (element) {
    element.style.display = '';
    element.removeAttribute('hidden');
    removeClass(element, 'hidden');
  }
}

/**
 * Hide element (add hidden attribute)
 * @param {HTMLElement} element - Target element
 */
export function hide(element) {
  if (element) {
    element.setAttribute('hidden', '');
  }
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Target element
 * @param {boolean} force - Force show or hide
 */
export function toggle(element, force = undefined) {
  if (!element) return;

  const isHidden = element.hasAttribute('hidden');

  if (force === undefined) {
    if (isHidden) {
      show(element);
    } else {
      hide(element);
    }
  } else if (force) {
    show(element);
  } else {
    hide(element);
  }
}

/**
 * Delegate event handler
 * @param {HTMLElement} parent - Parent element
 * @param {string} eventType - Event type
 * @param {string} selector - Child selector
 * @param {Function} handler - Event handler
 */
export function delegate(parent, eventType, selector, handler) {
  parent.addEventListener(eventType, (event) => {
    const target = event.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, event);
    }
  });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default {
  createElement,
  mount,
  render,
  unmount,
  clear,
  $,
  $$,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setAttributes,
  removeAttributes,
  show,
  hide,
  toggle,
  delegate,
  debounce,
  throttle
};
