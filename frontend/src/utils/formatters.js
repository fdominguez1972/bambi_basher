/**
 * Formatting Utilities
 * Functions for formatting dates, numbers, file sizes, etc.
 */

/**
 * Format Unix timestamp to date string
 * @param {number} timestamp - Unix timestamp (seconds)
 * @param {string} format - Format type: 'short', 'long', 'time', 'datetime'
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp, format = 'short') {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };

  return date.toLocaleString('en-US', options[format] || options.short);
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Unix timestamp (seconds)
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';

  const now = Date.now();
  const date = new Date(timestamp * 1000);
  const seconds = Math.floor((now - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);

    if (interval >= 1) {
      return interval === 1
        ? `1 ${unit} ago`
        : `${interval} ${unit}s ago`;
    }
  }

  return 'just now';
}

/**
 * Format file size in bytes to human-readable string
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '';

  return num.toLocaleString('en-US');
}

/**
 * Format number as percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '';

  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format confidence score (0-1) as percentage with color class
 * @param {number} confidence - Confidence value (0-1)
 * @returns {Object} Object with formatted value and color class
 */
export function formatConfidence(confidence) {
  if (confidence === null || confidence === undefined) {
    return { value: '', className: '' };
  }

  const percentage = (confidence * 100).toFixed(1);

  let className = '';
  if (confidence >= 0.8) {
    className = 'text-success';
  } else if (confidence >= 0.5) {
    className = 'text-warning';
  } else {
    className = 'text-error';
  }

  return {
    value: `${percentage}%`,
    className
  };
}

/**
 * Format duration in seconds to readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return '';

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert camelCase or snake_case to Title Case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export function toTitleCase(str) {
  if (!str) return '';

  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted coordinates
 */
export function formatCoordinates(lat, lng, decimals = 6) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return '';
  }

  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  return `${Math.abs(lat).toFixed(decimals)}°${latDir}, ${Math.abs(lng).toFixed(decimals)}°${lngDir}`;
}

/**
 * Format processing status with appropriate class
 * @param {string} status - Processing status
 * @returns {Object} Object with formatted value and color class
 */
export function formatStatus(status) {
  if (!status) return { value: '', className: '' };

  const statusMap = {
    pending: { value: 'Pending', className: 'text-muted' },
    processing: { value: 'Processing', className: 'text-info' },
    completed: { value: 'Completed', className: 'text-success' },
    failed: { value: 'Failed', className: 'text-error' },
    running: { value: 'Running', className: 'text-info' }
  };

  return statusMap[status.toLowerCase()] || {
    value: capitalize(status),
    className: ''
  };
}

export default {
  formatDate,
  formatRelativeTime,
  formatFileSize,
  formatNumber,
  formatPercentage,
  formatConfidence,
  formatDuration,
  truncate,
  capitalize,
  toTitleCase,
  formatCoordinates,
  formatStatus
};
