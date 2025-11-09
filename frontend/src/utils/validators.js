/**
 * Validation Utilities
 * Client-side validation functions
 */

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @returns {Object} Validation result
 */
export function validateRequired(value) {
  const isValid = value !== null && value !== undefined && value !== '';

  return {
    isValid,
    error: isValid ? null : 'This field is required'
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return {
    isValid,
    error: isValid ? null : 'Please enter a valid email address'
  };
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {Object} Validation result
 */
export function validateUsername(username, minLength = 3, maxLength = 30) {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < minLength) {
    return {
      isValid: false,
      error: `Username must be at least ${minLength} characters`
    };
  }

  if (username.length > maxLength) {
    return {
      isValid: false,
      error: `Username must be at most ${maxLength} characters`
    };
  }

  // Allow alphanumeric, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens'
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {number} minLength - Minimum length
 * @returns {Object} Validation result
 */
export function validatePassword(password, minLength = 8) {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} Validation result
 */
export function validatePasswordConfirmation(password, confirmPassword) {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  const isValid = password === confirmPassword;

  return {
    isValid,
    error: isValid ? null : 'Passwords do not match'
  };
}

/**
 * Validate number
 * @param {*} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Object} Validation result
 */
export function validateNumber(value, min = null, max = null) {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: 'Please enter a number' };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (min !== null && num < min) {
    return {
      isValid: false,
      error: `Value must be at least ${min}`
    };
  }

  if (max !== null && num > max) {
    return {
      isValid: false,
      error: `Value must be at most ${max}`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {Object} Validation result
 */
export function validateFileType(file, allowedTypes = []) {
  if (!file) {
    return { isValid: false, error: 'Please select a file' };
  }

  if (allowedTypes.length === 0) {
    return { isValid: true, error: null };
  }

  const isValid = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', ''));
    }
    return file.type === type;
  });

  return {
    isValid,
    error: isValid ? null : `File type must be ${allowedTypes.join(', ')}`
  };
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum size in bytes
 * @returns {Object} Validation result
 */
export function validateFileSize(file, maxSize) {
  if (!file) {
    return { isValid: false, error: 'Please select a file' };
  }

  const isValid = file.size <= maxSize;

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  return {
    isValid,
    error: isValid ? null : `File size must be less than ${formatSize(maxSize)}`
  };
}

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Object} Validation result
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Please select both start and end dates' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  const isValid = start <= end;

  return {
    isValid,
    error: isValid ? null : 'Start date must be before end date'
  };
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export function validateUrl(url) {
  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Validation result
 */
export function validateCoordinates(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return { isValid: false, error: 'Invalid coordinates' };
  }

  if (latNum < -90 || latNum > 90) {
    return {
      isValid: false,
      error: 'Latitude must be between -90 and 90'
    };
  }

  if (lngNum < -180 || lngNum > 180) {
    return {
      isValid: false,
      error: 'Longitude must be between -180 and 180'
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result with errors object
 */
export function validateForm(data, rules) {
  const errors = {};
  let isValid = true;

  Object.entries(rules).forEach(([field, validators]) => {
    const value = data[field];

    for (const validator of validators) {
      const result = validator(value);

      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });

  return { isValid, errors };
}

export default {
  validateRequired,
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordConfirmation,
  validateNumber,
  validateFileType,
  validateFileSize,
  validateDateRange,
  validateUrl,
  validateCoordinates,
  validateForm
};
