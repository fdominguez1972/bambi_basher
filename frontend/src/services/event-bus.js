/**
 * Event Bus
 * Centralized event system for component communication
 */

class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });

    return unsubscribe;
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.events.has(event)) {
      return;
    }

    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);

    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // Clean up empty event arrays
    if (callbacks.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...*} args - Arguments to pass to callbacks
   */
  emit(event, ...args) {
    if (!this.events.has(event)) {
      return;
    }

    const callbacks = this.events.get(event).slice(); // Copy to avoid mutation during iteration

    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name (optional - if not provided, clears all)
   */
  clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get all events
   * @returns {string[]} Array of event names
   */
  getEvents() {
    return Array.from(this.events.keys());
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Common event names
export const EVENTS = {
  // Auth events
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CHANGED: 'auth:changed',

  // Navigation events
  NAVIGATE: 'navigate',
  ROUTE_CHANGED: 'route:changed',

  // Notification events
  NOTIFY_SUCCESS: 'notify:success',
  NOTIFY_ERROR: 'notify:error',
  NOTIFY_WARNING: 'notify:warning',
  NOTIFY_INFO: 'notify:info',

  // Image events
  IMAGE_UPLOADED: 'image:uploaded',
  IMAGE_DELETED: 'image:deleted',
  IMAGES_UPDATED: 'images:updated',

  // Processing events
  PROCESSING_STARTED: 'processing:started',
  PROCESSING_PROGRESS: 'processing:progress',
  PROCESSING_COMPLETED: 'processing:completed',
  PROCESSING_FAILED: 'processing:failed',

  // Map events
  MAP_CREATED: 'map:created',
  MAP_UPDATED: 'map:updated',
  MAP_DELETED: 'map:deleted',
  LOCATION_ADDED: 'location:added',

  // Filter events
  FILTERS_CHANGED: 'filters:changed',
  FILTERS_RESET: 'filters:reset'
};

// Export singleton instance and class
export { eventBus, EventBus };

export default eventBus;
