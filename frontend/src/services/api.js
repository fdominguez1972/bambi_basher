/**
 * API Service
 * Centralized API communication with error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get session token from localStorage
 * @returns {string|null}
 */
function getSessionToken() {
  return localStorage.getItem('sessionId');
}

/**
 * Fetch wrapper with error handling and auth
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add auth token if available
  const token = getSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prepare fetch options
  const fetchOptions = {
    ...options,
    headers
  };

  // Add body if provided and not GET request
  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Request failed';
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    // Network errors or other fetch failures
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'Network error: Unable to connect to server',
      0,
      { originalError: error.message }
    );
  }
}

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<any>}
 */
export async function get(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return apiFetch(url, { method: 'GET' });
}

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise<any>}
 */
export async function post(endpoint, body = {}) {
  return apiFetch(endpoint, {
    method: 'POST',
    body
  });
}

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise<any>}
 */
export async function put(endpoint, body = {}) {
  return apiFetch(endpoint, {
    method: 'PUT',
    body
  });
}

/**
 * PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @returns {Promise<any>}
 */
export async function patch(endpoint, body = {}) {
  return apiFetch(endpoint, {
    method: 'PATCH',
    body
  });
}

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>}
 */
export async function del(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' });
}

/**
 * Upload file(s)
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - Form data with files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<any>}
 */
export async function upload(endpoint, formData, onProgress = null) {
  const url = `${API_BASE_URL}${endpoint}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (error) {
          resolve(xhr.responseText);
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new ApiError(
            errorData.message || 'Upload failed',
            xhr.status,
            errorData
          ));
        } catch (error) {
          reject(new ApiError('Upload failed', xhr.status));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error', 0));
    });

    // Send request
    xhr.open('POST', url);

    const token = getSessionToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
  });
}

export default {
  get,
  post,
  put,
  patch,
  del,
  upload,
  apiFetch
};
