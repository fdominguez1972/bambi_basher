/**
 * Storage Service
 * localStorage wrapper with error handling and JSON serialization
 */

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export function setItem(key, value) {
  if (!isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default
 */
export function getItem(key, defaultValue = null) {
  if (!isStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);

    if (item === null) {
      return defaultValue;
    }

    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export function removeItem(key) {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * @returns {boolean} Success status
 */
export function clear() {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Get all keys from localStorage
 * @returns {string[]} Array of keys
 */
export function keys() {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('Error getting localStorage keys:', error);
    return [];
  }
}

/**
 * Check if key exists in localStorage
 * @param {string} key - Storage key
 * @returns {boolean}
 */
export function hasItem(key) {
  if (!isStorageAvailable()) {
    return false;
  }

  return localStorage.getItem(key) !== null;
}

/**
 * Get storage size in bytes
 * @returns {number} Approximate size in bytes
 */
export function getSize() {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  } catch (error) {
    console.error('Error calculating localStorage size:', error);
    return 0;
  }
}

// User preferences management
const PREFERENCES_KEY = 'user_preferences';

/**
 * Get user preferences
 * @returns {Object} User preferences
 */
export function getPreferences() {
  return getItem(PREFERENCES_KEY, {});
}

/**
 * Set user preference
 * @param {string} key - Preference key
 * @param {*} value - Preference value
 * @returns {boolean} Success status
 */
export function setPreference(key, value) {
  const preferences = getPreferences();
  preferences[key] = value;
  return setItem(PREFERENCES_KEY, preferences);
}

/**
 * Get specific preference
 * @param {string} key - Preference key
 * @param {*} defaultValue - Default value
 * @returns {*} Preference value
 */
export function getPreference(key, defaultValue = null) {
  const preferences = getPreferences();
  return preferences[key] !== undefined ? preferences[key] : defaultValue;
}

/**
 * Remove specific preference
 * @param {string} key - Preference key
 * @returns {boolean} Success status
 */
export function removePreference(key) {
  const preferences = getPreferences();
  delete preferences[key];
  return setItem(PREFERENCES_KEY, preferences);
}

/**
 * Clear all preferences
 * @returns {boolean} Success status
 */
export function clearPreferences() {
  return removeItem(PREFERENCES_KEY);
}

export default {
  setItem,
  getItem,
  removeItem,
  clear,
  keys,
  hasItem,
  getSize,
  getPreferences,
  setPreference,
  getPreference,
  removePreference,
  clearPreferences
};
