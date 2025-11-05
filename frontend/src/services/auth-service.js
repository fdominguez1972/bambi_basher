/**
 * Authentication Service
 * Manages user authentication state and session
 */

import { post, get } from './api.js';

// Current user state
let currentUser = null;
let authListeners = [];

/**
 * Login user with username and password
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} User and session data
 */
export async function login(username, password) {
  try {
    const response = await post('/auth/login', { username, password });

    // Store session ID
    if (response.session && response.session.id) {
      localStorage.setItem('sessionId', response.session.id);
    }

    // Set current user
    if (response.user) {
      currentUser = response.user;
      notifyAuthListeners();
    }

    return response;
  } catch (error) {
    // Clear any stale session data on login failure
    localStorage.removeItem('sessionId');
    currentUser = null;
    throw error;
  }
}

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    // Call logout endpoint
    await post('/auth/logout');
  } catch (error) {
    // Continue with logout even if API call fails
    console.error('Logout error:', error);
  } finally {
    // Clear session data
    localStorage.removeItem('sessionId');
    currentUser = null;
    notifyAuthListeners();
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export async function getCurrentUser() {
  // Return cached user if available
  if (currentUser) {
    return currentUser;
  }

  // Check if we have a session
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    return null;
  }

  try {
    // Fetch current user from API
    const response = await get('/auth/me');

    if (response.user) {
      currentUser = response.user;
      notifyAuthListeners();
      return currentUser;
    }

    return null;
  } catch (error) {
    // Session is invalid
    localStorage.removeItem('sessionId');
    currentUser = null;
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem('sessionId');
}

/**
 * Check if current user has specific role
 * @param {string} role - Role to check ('admin' or 'user')
 * @returns {boolean}
 */
export function hasRole(role) {
  return currentUser && currentUser.role === role;
}

/**
 * Check if current user is admin
 * @returns {boolean}
 */
export function isAdmin() {
  return hasRole('admin');
}

/**
 * Get cached current user (synchronous)
 * @returns {Object|null} User object or null
 */
export function getCachedUser() {
  return currentUser;
}

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function called when auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  authListeners.push(callback);

  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
}

/**
 * Notify all auth listeners of state change
 */
function notifyAuthListeners() {
  authListeners.forEach(listener => {
    try {
      listener(currentUser);
    } catch (error) {
      console.error('Error in auth listener:', error);
    }
  });
}

/**
 * Initialize authentication state
 * Checks for existing session and loads user data
 * @returns {Promise<Object|null>} Current user or null
 */
export async function initAuth() {
  return await getCurrentUser();
}

export default {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  hasRole,
  isAdmin,
  getCachedUser,
  onAuthChange,
  initAuth
};
